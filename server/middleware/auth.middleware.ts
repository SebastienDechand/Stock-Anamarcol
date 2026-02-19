import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model";
import type { DecodedToken } from "../types/auth";
import { Role } from "../constants";

// Resolves user from JWT and applies SUPERADMIN_EMAIL override
async function resolveUser(token: string) {
  const decoded = jwt.verify(
    token,
    process.env.TOKEN_SECRET as string,
  ) as DecodedToken;
  const user = await UserModel.findById(decoded.id).select("-password").lean();
  if (user) {
    if (
      process.env.SUPERADMIN_EMAIL &&
      typeof user.email === "string" &&
      user.email.toLowerCase() === process.env.SUPERADMIN_EMAIL.toLowerCase()
    ) {
      (user as unknown as Record<string, unknown>).roles = [Role.SUPERADMIN];
    } else if (!user.roles || user.roles.length === 0) {
      // Safety fallback for any unmigrated document
      (user as unknown as Record<string, unknown>).roles = [Role.USER];
    }
  }
  return user;
}

// Checks if user is logged in (non-blocking)
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

// Authentication required (blocking — returns 401)
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

// Requires admin or superadmin role
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
      if (
        !(
          user.roles?.includes(Role.ADMIN) ||
          user.roles?.includes(Role.SUPERADMIN)
        )
      ) {
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

// Requires hotline OR admin/superadmin role
export const requireHotline = (
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
      if (
        !(
          user.roles?.includes(Role.HOTLINE) ||
          user.roles?.includes(Role.ADMIN) ||
          user.roles?.includes(Role.SUPERADMIN)
        )
      ) {
        res
          .status(403)
          .json({ message: "Accès refusé - hotline ou admin requis" });
        return;
      }
      res.locals.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ message: "Token invalide ou expiré" });
    });
};

// Requires monteur OR admin/superadmin role
export const requireMonteur = (
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
      if (
        !(
          user.roles?.includes(Role.MONTEUR) ||
          user.roles?.includes(Role.ADMIN) ||
          user.roles?.includes(Role.SUPERADMIN)
        )
      ) {
        res
          .status(403)
          .json({ message: "Accès refusé - monteur ou admin requis" });
        return;
      }
      res.locals.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ message: "Token invalide ou expiré" });
    });
};

// Requires superadmin role only
export const requireSuperAdmin = (
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
      if (!user.roles?.includes(Role.SUPERADMIN)) {
        res.status(403).json({ message: "Accès refusé - superadmin requis" });
        return;
      }
      res.locals.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ message: "Token invalide ou expiré" });
    });
};
