import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../../models/user.model";
import type { DecodedToken } from "../../types/auth";
import { Role } from "../../constants";
import { ErrorCode } from "../../constants/errorCodes";

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

interface AccessDenied {
  message: string;
  code: ErrorCode;
}

function requireRole(
  roles: Role[],
  accessDenied?: AccessDenied,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies.jwt;
    if (!token) {
      res
        .status(401)
        .json({ message: "Authentication required", code: ErrorCode.AUTH_REQUIRED });
      return;
    }

    resolveUser(token)
      .then((user) => {
        if (!user) {
          res
            .status(401)
            .json({ message: "User not found", code: ErrorCode.USER_NOT_FOUND });
          return;
        }
        if (
          accessDenied &&
          !roles.some((role) => user.roles?.includes(role))
        ) {
          res.status(403).json(accessDenied);
          return;
        }
        res.locals.user = user;
        next();
      })
      .catch(() => {
        res
          .status(401)
          .json({ message: "Invalid or expired token", code: ErrorCode.INVALID_TOKEN });
      });
  };
}

export const requireAuth = requireRole([]);

export const requireAdmin = requireRole([Role.ADMIN, Role.SUPERADMIN], {
  message: "Access denied - admin required",
  code: ErrorCode.ACCESS_DENIED_ADMIN,
});

// Requires hotline OR admin/superadmin role
export const requireHotline = requireRole(
  [Role.HOTLINE, Role.ADMIN, Role.SUPERADMIN],
  {
    message: "Access denied - hotline or admin required",
    code: ErrorCode.ACCESS_DENIED_HOTLINE,
  },
);

// Requires monteur OR admin/superadmin role
export const requireMonteur = requireRole(
  [Role.MONTEUR, Role.ADMIN, Role.SUPERADMIN],
  {
    message: "Access denied - monteur or admin required",
    code: ErrorCode.ACCESS_DENIED_MONTEUR,
  },
);

// Requires superadmin role only
export const requireSuperAdmin = requireRole([Role.SUPERADMIN], {
  message: "Access denied - superadmin required",
  code: ErrorCode.ACCESS_DENIED_SUPERADMIN,
});
