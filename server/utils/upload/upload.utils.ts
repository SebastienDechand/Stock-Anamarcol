import { Request, Response } from "express";
import multer from "multer";
import { uploadErrors } from "../errors/errors.utils";
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "../../constants";
import { ErrorCode } from "../../constants/errorCodes";

// Shared multer instance for single-image uploads (profile/item/contact
// pictures) - rejects oversized/wrong-type files before buffering them
// in memory, instead of relying solely on the post-hoc check below.
export const imageUpload = multer({
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (
      ACCEPTED_IMAGE_TYPES.includes(
        file.mimetype as (typeof ACCEPTED_IMAGE_TYPES)[number],
      )
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file"));
    }
  },
});

/**
 * Validates the uploaded file (MIME type + size).
 * Returns `true` if valid; sends an error and returns `false` otherwise.
 */
export function validateUploadedFile(req: Request, res: Response): boolean {
  const file = req.file;
  if (!file) {
    res
      .status(400)
      .json({ message: "No file provided", code: ErrorCode.NO_FILE_PROVIDED });
    return false;
  }

  if (
    !ACCEPTED_IMAGE_TYPES.includes(
      file.mimetype as (typeof ACCEPTED_IMAGE_TYPES)[number],
    )
  ) {
    const errors = uploadErrors(new Error("Invalid file"), file.mimetype);
    res.status(400).json({ errors });
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    const errors = uploadErrors(new Error("Max size"), file.mimetype);
    res.status(400).json({ errors });
    return false;
  }

  return true;
}

/**
 * Uploads an image buffer to ImgBB and returns the public URL.
 */
export async function uploadToImgBB(
  fileBuffer: Buffer,
  fileName: string,
): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("IMGBB_API_KEY is not defined in environment variables");
  }

  const base64Image = fileBuffer.toString("base64");

  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", base64Image);
  formData.append("name", fileName);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ImgBB upload failed (${response.status}): ${errorBody}`);
  }

  const result = (await response.json()) as { data: { url: string } };
  return result.data.url;
}
