import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Mock the UserModel
jest.mock("../models/user.model", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    pseudo: "testuser",
    email: "test@test.com",
    role: "user",
    password: "hashedpassword",
    save: jest.fn(),
  };

  const UserModel = {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      }),
    }),
  };

  return { __esModule: true, default: UserModel };
});

import {
  checkUser,
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  requireHotline,
} from "../middleware/auth.middleware";

describe("Auth Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { cookies: {} };
    res = {
      locals: {},
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn() as unknown as Response["json"],
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ─── checkUser ─────────────────────────────────────────
  describe("checkUser", () => {
    it("should call next with user = null when no token", () => {
      checkUser(req as Request, res as Response, next);
      expect(res.locals!.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it("should decode the token and load the user", async () => {
      const token = jwt.sign(
        { id: "507f1f77bcf86cd799439011" },
        process.env.TOKEN_SECRET!,
      );
      req.cookies = { jwt: token };

      await checkUser(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(next).toHaveBeenCalled();
    });

    it("should set user to null when token is invalid", async () => {
      req.cookies = { jwt: "invalid-token" };

      await checkUser(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.locals!.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });

  // ─── requireAuth ───────────────────────────────────────
  describe("requireAuth", () => {
    it("should return 401 when no token is provided", () => {
      requireAuth(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentification requise",
      });
    });

    it("should return 401 when token is invalid", async () => {
      req.cookies = { jwt: "bad-token" };

      await requireAuth(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should call next when token is valid", async () => {
      const token = jwt.sign(
        { id: "507f1f77bcf86cd799439011" },
        process.env.TOKEN_SECRET!,
      );
      req.cookies = { jwt: token };

      await requireAuth(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(next).toHaveBeenCalled();
    });
  });

  // ─── requireAdmin ──────────────────────────────────────
  describe("requireAdmin", () => {
    it("should return 401 when no token is provided", () => {
      requireAdmin(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 401 when token is invalid", async () => {
      req.cookies = { jwt: "invalid" };

      await requireAdmin(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ─── requireSuperAdmin ───────────────────────────────
  describe("requireSuperAdmin", () => {
    it("should return 401 when no token is provided", () => {
      requireSuperAdmin(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentification requise",
      });
    });

    it("should return 401 when token is invalid", async () => {
      req.cookies = { jwt: "bad-token" };

      await requireSuperAdmin(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 403 when user is not superadmin", async () => {
      // mockUser has role "user" by default
      const token = jwt.sign(
        { id: "507f1f77bcf86cd799439011" },
        process.env.TOKEN_SECRET!,
      );
      req.cookies = { jwt: token };

      await requireSuperAdmin(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Accès refusé - superadmin requis",
      });
    });
  });

  // ─── requireHotline ───────────────────────────────
  describe("requireHotline", () => {
    it("should return 401 when no token is provided", () => {
      requireHotline(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentification requise",
      });
    });

    it("should return 403 when user is not hotline/admin/superadmin", async () => {
      const token = jwt.sign(
        { id: "507f1f77bcf86cd799439011" },
        process.env.TOKEN_SECRET!,
      );
      req.cookies = { jwt: token };

      await requireHotline(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Accès refusé - hotline ou admin requis",
      });
    });
  });
});
