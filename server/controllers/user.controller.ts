import { Request, Response } from "express";
import UserModel, { IUser } from "../models/user.model";
import { validateObjectId } from "../utils/validate.utils";
import { logEvent } from "../utils/audit.utils";

// Set role for a user (admin only)
export const setRole = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  const { role } = req.body as { role?: string };
  const allowed = ["user", "admin", "superadmin"];
  if (!role || !allowed.includes(role)) {
    res.status(400).json({ message: "Role invalide" });
    return;
  }

  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }
    // @ts-ignore
    user.role = role as any;
    const updated = await user.save();
    await logEvent(
      "update",
      "user",
      updated._id.toString(),
      res.locals.user?.pseudo,
      { role },
    );
    res
      .status(200)
      .json({ message: "Rôle mis à jour", user: updated._id, role });
  } catch (err) {
    console.error("Error setting role:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

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

    const old =
      typeof (user as any).toObject === "function"
        ? (user as any).toObject()
        : { ...(user as any) };
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    if (req.body.poste) user.poste = req.body.poste;
    if (req.body.numero) user.numero = req.body.numero;
    if (req.body.pole !== undefined) user.pole = req.body.pole;
    if (req.body.picture) user.picture = req.body.picture;

    const updatedUser = await user.save();
    try {
      const changes: Record<string, { old?: unknown; new?: unknown }> = {};
      const fields: Array<keyof IUser> = [
        "email",
        "poste",
        "numero",
        "pole",
        "picture",
      ];
      const oldObj = old as Partial<Record<keyof IUser, unknown>>;
      const newObj = updatedUser as Partial<Record<keyof IUser, unknown>>;
      for (const key of fields) {
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        if (String(oldVal ?? "") !== String(newVal ?? "")) {
          changes[key as string] = { old: oldVal, new: newVal };
        }
      }
      if (Object.keys(changes).length > 0) {
        await logEvent(
          "update",
          "user",
          updatedUser._id.toString(),
          res.locals.user?.pseudo,
          { changes },
        );
      }
    } catch (err) {
      console.error("Audit user update error:", err);
    }

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
    // findById may be mocked and not return a query with `.lean()` in tests
    const maybeQuery = UserModel.findById(req.params.id as string);
    let toDelete: unknown = undefined;
    if (maybeQuery) {
      if (typeof (maybeQuery as any).lean === "function") {
        toDelete = await (maybeQuery as any).lean();
      } else if (typeof (maybeQuery as any).then === "function") {
        // it's a thenable (promise)
        toDelete = await maybeQuery;
      } else {
        // fallback: call and hope for the best
        toDelete = undefined;
      }
    }
    await UserModel.deleteOne({ _id: req.params.id }).exec();
    try {
      await logEvent(
        "delete",
        "user",
        String(req.params.id),
        res.locals.user?.pseudo,
        { deleted: toDelete },
      );
    } catch (err) {
      console.error("logEvent delete user error:", err);
    }
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting user:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};
