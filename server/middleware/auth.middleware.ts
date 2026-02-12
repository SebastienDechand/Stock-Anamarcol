import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model";

interface DecodedToken {
  id: string;
}

// Vérifie si l'utilisateur est connecté (non bloquant)
export const checkUser = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(
      token,
      process.env.TOKEN_SECRET as string,
      async (err: jwt.VerifyErrors | null, decodedToken: unknown) => {
        if (err) {
          res.locals.user = null;
          next();
        } else {
          const decoded = decodedToken as DecodedToken;
          const user = await UserModel.findById(decoded.id)
            .select("-password")
            .lean();
          res.locals.user = user;
          next();
        }
      },
    );
  } else {
    res.locals.user = null;
    next();
  }
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

  jwt.verify(
    token,
    process.env.TOKEN_SECRET as string,
    async (err: jwt.VerifyErrors | null, decodedToken: unknown) => {
      if (err) {
        res.status(401).json({ message: "Token invalide ou expiré" });
        return;
      }

      const decoded = decodedToken as DecodedToken;
      const user = await UserModel.findById(decoded.id)
        .select("-password")
        .lean();
      if (!user) {
        res.status(401).json({ message: "Utilisateur introuvable" });
        return;
      }

      res.locals.user = user;
      next();
    },
  );
};

// Vérifie que l'utilisateur est admin
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

  jwt.verify(
    token,
    process.env.TOKEN_SECRET as string,
    async (err: jwt.VerifyErrors | null, decodedToken: unknown) => {
      if (err) {
        res.status(401).json({ message: "Token invalide ou expiré" });
        return;
      }

      const decoded = decodedToken as DecodedToken;
      const user = await UserModel.findById(decoded.id)
        .select("-password")
        .lean();
      if (!user) {
        res.status(401).json({ message: "Utilisateur introuvable" });
        return;
      }
      if (user.role !== "admin") {
        res.status(403).json({ message: "Accès refusé - admin requis" });
        return;
      }

      res.locals.user = user;
      next();
    },
  );
};
