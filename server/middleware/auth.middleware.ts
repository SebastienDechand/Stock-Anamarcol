import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model";

interface DecodedToken {
  id: string;
}

// Résout le user à partir du JWT + applique le SUPERADMIN_EMAIL override
async function resolveUser(token: string) {
  const decoded = jwt.verify(
    token,
    process.env.TOKEN_SECRET as string,
  ) as DecodedToken;
  const user = await UserModel.findById(decoded.id).select("-password").lean();
  if (
    user &&
    process.env.SUPERADMIN_EMAIL &&
    typeof user.email === "string" &&
    user.email.toLowerCase() === process.env.SUPERADMIN_EMAIL.toLowerCase()
  ) {
    // @ts-ignore
    user.role = "superadmin";
  }
  return user;
}

// Vérifie si l'utilisateur est connecté (non bloquant)
export const checkUser = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies.jwt;
  if (!token) {
    res.locals.user = null;
    next();
    return;
  }

  resolveUser(token)
    .then((user) => {
      res.locals.user = user;
      next();
    })
    .catch(() => {
      res.locals.user = null;
      next();
    });
};

// Authentification requise (bloquant - renvoie 401)
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies.jwt;
  if (!token) {
    res.status(401).json({ message: "Authentification requise" });
    return;
  }

  resolveUser(token)
    .then((user) => {
      if (!user) {
        res.status(401).json({ message: "Utilisateur introuvable" });
        return;
      }
      res.locals.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ message: "Token invalide ou expiré" });
    });
};

// Vérifie que l'utilisateur est admin ou superadmin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies.jwt;
  if (!token) {
    res.status(401).json({ message: "Authentification requise" });
    return;
  }

  resolveUser(token)
    .then((user) => {
      if (!user) {
        res.status(401).json({ message: "Utilisateur introuvable" });
        return;
      }
      if (!(user.role === "admin" || user.role === "superadmin")) {
        res.status(403).json({ message: "Accès refusé - admin requis" });
        return;
      }
      res.locals.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ message: "Token invalide ou expiré" });
    });
};
