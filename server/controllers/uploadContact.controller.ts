import { Request, Response } from "express";
import ContactModel from "../models/contact.model";
import { validateUploadedFile, uploadToImgBB } from "../utils/upload.utils";
import { logEvent } from "../utils/audit.utils";

export const uploadContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateUploadedFile(req, res)) return;

  const fileName = req.body.name + ".jpg";

  try {
    const pictureUrl = await uploadToImgBB(req.file!.buffer, fileName);

    const updatedContact = await ContactModel.findByIdAndUpdate(
      req.body.contactId,
      { $set: { picture: pictureUrl } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // Audit
    try {
      await logEvent(
        "upload",
        "contact",
        req.body.contactId,
        res.locals.user?.pseudo,
        { pictureUrl },
      );
    } catch (err) {
      console.error("Audit upload contact error:", err);
    }

    res.json(updatedContact);
  } catch (err) {
    console.error("File upload or database update error:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
