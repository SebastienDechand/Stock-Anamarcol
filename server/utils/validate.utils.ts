import { Response } from "express";
import mongoose from "mongoose";

/**
 * Valide un ObjectID MongoDB. Renvoie 400 si invalide.
 * @returns `true` si l'ID est valide, `false` sinon (réponse déjà envoyée).
 */
export function validateObjectId(id: string, res: Response): boolean {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "ID invalide" });
    return false;
  }
  return true;
}
