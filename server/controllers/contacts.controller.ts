import { Request, Response } from "express";
import ContactModel from "../models/contact.model";
import { validateObjectId } from "../utils/validate.utils";

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

    if (req.body.nom) contact.nom = req.body.nom;
    if (req.body.email) contact.email = req.body.email;
    if (req.body.lien) contact.lien = req.body.lien;
    if (req.body.poste) contact.poste = req.body.poste;
    if (req.body.tel) contact.tel = req.body.tel;
    if (req.body.picture) contact.picture = req.body.picture;

    const updatedContact = await contact.save();
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
    await ContactModel.deleteOne({ _id: req.params.id }).exec();
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting contact:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};
