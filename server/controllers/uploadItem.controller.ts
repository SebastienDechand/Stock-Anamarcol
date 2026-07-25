import { Request, Response } from "express";
import ItemModel from "../models/item.model";
import { validateUploadedFile, uploadToImgBB } from "../utils/upload.utils";
import { handleError } from "../utils/response.utils";

export const uploadItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateUploadedFile(req, res)) return;

  const fileName =
    req.body.name + req.body.supplier + req.body.status + ".jpg";

  try {
    const imageUrl = await uploadToImgBB(req.file!.buffer, fileName);

    const updatedItem = await ItemModel.findByIdAndUpdate(
      req.body.itemId,
      { $set: { image: imageUrl } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json(updatedItem);
  } catch (err) {
    handleError(res, err, "File upload or database update error:");
  }
};
