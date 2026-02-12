import { Request, Response } from "express";
import fs from "fs";
import stream from "stream";
import { pipeline } from "stream/promises";
import path from "path";
import { uploadErrors } from "../errors.utils";
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "../constants";

/**
 * Valide le fichier uploadé (type MIME + taille).
 * Retourne `true` si valide, envoie une erreur et retourne `false` sinon.
 */
export function validateUploadedFile(req: Request, res: Response): boolean {
  const file = req.file;
  if (!file) {
    res.status(400).json({ message: "No file provided" });
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
 * Écrit le buffer du fichier uploadé sur le disque.
 */
export async function writeUploadedFile(
  fileBuffer: Buffer,
  fileName: string,
  uploadDir: string,
): Promise<string> {
  const filePath = path.join(
    __dirname,
    `/../../client/public/uploads/${uploadDir}/${fileName}`,
  );

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  await pipeline(bufferStream, fs.createWriteStream(filePath));

  return `/uploads/${uploadDir}/${fileName}`;
}
