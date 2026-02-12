import { Request, Response } from "express";
import ContactModel from "../models/contact.model";
import { validateUploadedFile, writeUploadedFile } from "../utils/upload.utils";

export const uploadContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateUploadedFile(req, res)) return;

  const fileName = req.body.nom + ".jpg";

  try {
    const picturePath = await writeUploadedFile(
      req.file!.buffer,
      fileName,
      "contacts",
    );

    const updatedContact = await ContactModel.findByIdAndUpdate(
      req.body.contactId,
      { $set: { picture: picturePath } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json(updatedContact);
  } catch (err) {
    console.error("File upload or database update error:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
