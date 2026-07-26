import { Request, Response } from 'express';
import { IContact } from '../../models/contact.model';
import * as contactsService from '../../services/contacts/contacts.service';
import { validateObjectId } from '../../utils/validate/validate.utils';
import { logEvent } from '../../utils/audit/audit.utils';
import { handleError } from '../../utils/response/response.utils';
import { ErrorCode } from '../../constants/errorCodes';

export const getContacts = async (_req: Request, res: Response): Promise<void> => {
  const contacts = await contactsService.listContacts();
  res.status(200).json(contacts);
};

export const contactInfo = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const contact = await contactsService.findContactById(req.params.id as string);
    if (!contact) {
      res.status(404).json({ message: 'Contact not found', code: ErrorCode.CONTACT_NOT_FOUND });
      return;
    }
    res.status(200).json(contact);
  } catch (err) {
    handleError(res, err, 'Error fetching contact:');
  }
};

export const createContact = async (req: Request, res: Response): Promise<void> => {
  const { name, email, link, position, phone, category } = req.body;

  try {
    const contact = await contactsService.createContact({
      name,
      email,
      link,
      position,
      phone,
      category,
    });
    // Audit
    await logEvent('create', 'contact', contact._id.toString(), res.locals.user?.username, {
      entityName: name,
    });
    res.status(200).json({ contact: contact._id });
  } catch (err) {
    res.status(400).json({
      message: 'Error creating contact',
      code: ErrorCode.CONTACT_CREATE_ERROR,
    });
  }
};

export const updateContact = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const contact = await contactsService.findContactDocument(req.params.id as string);

    if (!contact) {
      res.status(404).json({ message: 'Contact not found', code: ErrorCode.CONTACT_NOT_FOUND });
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
        'name',
        'email',
        'link',
        'position',
        'phone',
        'picture',
        'category',
      ];
      const oldObj = old as Partial<Record<keyof IContact, unknown>>;
      const newObj = updatedContact as Partial<Record<keyof IContact, unknown>>;
      for (const key of fields) {
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          changes[key as string] = { old: oldVal, new: newVal };
        }
      }
      if (Object.keys(changes).length > 0) {
        await logEvent(
          'update',
          'contact',
          updatedContact._id.toString(),
          res.locals.user?.username,
          { changes, entityName: updatedContact.name },
        );
      }
    } catch (err) {
      console.error('Audit contact update error:', err);
    }

    res.send(updatedContact);
  } catch (err) {
    handleError(res, err, 'Error updating contact:');
  }
};

export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const toDelete = await contactsService.findContactById(req.params.id as string);
    await contactsService.deleteContactById(req.params.id as string);
    // Audit
    try {
      await logEvent('delete', 'contact', String(req.params.id), res.locals.user?.username, {
        deleted: toDelete,
      });
    } catch (err) {
      console.error('logEvent delete contact error:', err);
    }
    res.status(200).json({ message: 'Successfully deleted', code: ErrorCode.DELETED });
  } catch (err) {
    handleError(res, err, 'Error deleting contact:');
  }
};
