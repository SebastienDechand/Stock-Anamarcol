import { Request, Response } from "express";
import ContactModel, { IContact } from "../models/contact.model";
import { validateObjectId } from "../utils/validate.utils";
import { logEvent } from "../utils/audit.utils";
import { ErrorCode } from "../constants/errorCodes";

export const getContacts = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const contacts = await ContactModel.find();
  res.status(200).json(contacts);
};

export const contactInfo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const contact = await ContactModel.findById(req.params.id).lean();
    if (!contact) {
      res
        .status(404)
        .json({ message: "Contact not found", code: ErrorCode.CONTACT_NOT_FOUND });
      return;
    }
    res.status(200).json(contact);
  } catch (err) {
    console.error("Error fetching contact:", err);
    res
      .status(500)
      .json({ message: "Internal server error", code: ErrorCode.INTERNAL_ERROR });
  }
};

export const createContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, email, link, position, phone, category } = req.body;

  try {
    const contact = await ContactModel.create({
      name,
      email,
      link,
      position,
      phone,
      category,
    });
    // Audit
    await logEvent(
      "create",
      "contact",
      contact._id.toString(),
      res.locals.user?.username,
      { entityName: name },
    );
    res.status(200).json({ contact: contact._id });
  } catch (err) {
    res.status(400).json({
      message: "Error creating contact",
      code: ErrorCode.CONTACT_CREATE_ERROR,
    });
  }
};

export const updateContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const contact = await ContactModel.findById(req.params.id);

    if (!contact) {
      res
        .status(404)
        .json({ message: "Contact not found", code: ErrorCode.CONTACT_NOT_FOUND });
      return;
    }

    const old = contact.toObject();
    if (req.body.name) contact.name = req.body.name;
    if (req.body.email) contact.email = req.body.email;
    if (req.body.link) contact.link = req.body.link;
    if (req.body.position) contact.position = req.body.position;
    if (req.body.phone) contact.phone = req.body.phone;
    if (req.body.picture) contact.picture = req.body.picture;
    if (req.body.category) contact.category = req.body.category;

    const updatedContact = await contact.save();
    // Audit: record updated fields
    try {
      const changes: Record<string, { old?: unknown; new?: unknown }> = {};
      const fields: Array<keyof IContact> = [
        "name",
        "email",
        "link",
        "position",
        "phone",
        "picture",
        "category",
      ];
      const oldObj = old as Partial<Record<keyof IContact, unknown>>;
      const newObj = updatedContact as Partial<Record<keyof IContact, unknown>>;
      for (const key of fields) {
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        if (String(oldVal ?? "") !== String(newVal ?? "")) {
          changes[key as string] = { old: oldVal, new: newVal };
        }
      }
      if (Object.keys(changes).length > 0) {
        await logEvent(
          "update",
          "contact",
          updatedContact._id.toString(),
          res.locals.user?.username,
          { changes, entityName: updatedContact.name },
        );
      }
    } catch (err) {
      console.error("Audit contact update error:", err);
    }

    res.send(updatedContact);
  } catch (err) {
    console.error("Error updating contact:", err);
    res
      .status(500)
      .json({ message: "Internal server error", code: ErrorCode.INTERNAL_ERROR });
  }
};

export const deleteContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const maybeQuery = ContactModel.findById(req.params.id as string);
    let toDelete: unknown = undefined;
    if (maybeQuery) {
      if (typeof maybeQuery.lean === "function") {
        toDelete = await maybeQuery.lean();
      } else if (
        typeof (maybeQuery as { then?: unknown }).then === "function"
      ) {
        toDelete = await maybeQuery;
      }
    }
    await ContactModel.deleteOne({ _id: req.params.id }).exec();
    // Audit
    try {
      await logEvent(
        "delete",
        "contact",
        String(req.params.id),
        res.locals.user?.username,
        { deleted: toDelete },
      );
    } catch (err) {
      console.error("logEvent delete contact error:", err);
    }
    res
      .status(200)
      .json({ message: "Successfully deleted", code: ErrorCode.DELETED });
  } catch (err) {
    console.error("Error deleting contact:", err);
    res
      .status(500)
      .json({ message: "Internal server error", code: ErrorCode.INTERNAL_ERROR });
  }
};
