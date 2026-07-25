import { Request, Response } from "express";
import ContactModel from "../../models/contact.model";
import { validateUploadedFile, uploadToImgBB } from "../../utils/upload/upload.utils";
import { logEvent } from "../../utils/audit/audit.utils";
import { handleError } from "../../utils/response/response.utils";

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
        res.locals.user?.username,
        { pictureUrl },
      );
    } catch (err) {
      console.error("Audit upload contact error:", err);
    }

    res.json(updatedContact);
  } catch (err) {
    handleError(res, err, "File upload or database update error:");
  }
};
