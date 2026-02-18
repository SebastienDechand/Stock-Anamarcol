import { Request, Response } from "express";
import ContactModel, { IContact } from "../models/contact.model";
import { validateObjectId } from "../utils/validate.utils";
import { logEvent } from "../utils/audit.utils";

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
      res.status(404).json({ message: "Contact introuvable" });
      return;
    }
    res.status(200).json(contact);
  } catch (err) {
    console.error("Error fetching contact:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const createContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { nom, email, lien, poste, tel } = req.body;

  try {
    const contact = await ContactModel.create({ nom, email, lien, poste, tel });
    // Audit
    await logEvent(
      "create",
      "contact",
      contact._id.toString(),
      res.locals.user?.pseudo,
      { entityName: nom },
    );
    res.status(200).json({ contact: contact._id });
  } catch (err) {
    res.status(400).json({ message: "Erreur lors de la création du contact" });
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
      res.status(404).json({ message: "Contact introuvable" });
      return;
    }

    const old = contact.toObject();
    if (req.body.nom) contact.nom = req.body.nom;
    if (req.body.email) contact.email = req.body.email;
    if (req.body.lien) contact.lien = req.body.lien;
    if (req.body.poste) contact.poste = req.body.poste;
    if (req.body.tel) contact.tel = req.body.tel;
    if (req.body.picture) contact.picture = req.body.picture;

    const updatedContact = await contact.save();
    // Audit: record updated fields
    try {
      const changes: Record<string, { old?: unknown; new?: unknown }> = {};
      const fields: Array<keyof IContact> = [
        "nom",
        "email",
        "lien",
        "poste",
        "tel",
        "picture",
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
          res.locals.user?.pseudo,
          { changes, entityName: updatedContact.nom },
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
      .json({ message: (err as Error).message || "Internal Server Error" });
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
        res.locals.user?.pseudo,
        { deleted: toDelete },
      );
    } catch (err) {
      console.error("logEvent delete contact error:", err);
    }
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting contact:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};
