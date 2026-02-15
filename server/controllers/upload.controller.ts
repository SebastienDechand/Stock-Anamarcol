import { Request, Response } from "express";
import UserModel from "../models/user.model";
import { validateUploadedFile, uploadToImgBB } from "../utils/upload.utils";
import { logEvent } from "../utils/audit.utils";

export const uploadProfil = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateUploadedFile(req, res)) return;

  const fileName = req.body.name + ".jpg";

  try {
    const pictureUrl = await uploadToImgBB(req.file!.buffer, fileName);

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.body.userId,
      { $set: { picture: pictureUrl } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    try {
      await logEvent(
        "upload",
        "user",
        req.body.userId,
        res.locals.user?.pseudo,
        { pictureUrl },
      );
    } catch (err) {
      console.error("Audit upload user error:", err);
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("File upload or database update error:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
