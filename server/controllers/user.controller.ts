import { Request, Response } from "express";
import UserModel from "../models/user.model";
import { validateObjectId } from "../utils/validate.utils";

// Retourne tous les utilisateurs enregistrés
export const getAllUsers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const users = await UserModel.find().select("-password");
  res.status(200).json(users);
};

// Retourne les infos d'un utilisateur par son id
export const userInfo = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const user = await UserModel.findById(req.params.id)
      .select("-password")
      .lean();
    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// Mise à jour d'un utilisateur
export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }

    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    if (req.body.poste) user.poste = req.body.poste;
    if (req.body.numero) user.numero = req.body.numero;
    if (req.body.picture) user.picture = req.body.picture;

    const updatedUser = await user.save();
    res.send(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};

// Suppression d'un utilisateur
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    await UserModel.deleteOne({ _id: req.params.id }).exec();
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting user:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};
