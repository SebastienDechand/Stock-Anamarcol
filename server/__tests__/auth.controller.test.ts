import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { Role } from "../constants";

const mockCreate = vi.fn();
const mockLogin = vi.fn();

vi.mock("../models/user.model", () => ({
  __esModule: true,
  default: {
    create: (...args: unknown[]) => mockCreate(...args),
    login: (...args: unknown[]) => mockLogin(...args),
  },
}));

vi.mock("../utils/audit.utils", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

import { signUp, signIn, logout } from "../controllers/auth.controller";

describe("Auth Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { body: {}, cookies: {} };
    res = {
      locals: {},
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
      cookie: vi.fn() as unknown as Response["cookie"],
    };
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── signUp ────────────────────────────────────────────
  describe("signUp", () => {
    it("should create a user and return 200 with user ID", async () => {
      req.body = {
        pseudo: "testuser",
        email: "test@test.com",
        password: "Password1",
        poste: "Dev",
        numero: "0600000000",
        pole: "Direction",
      };
      mockCreate.mockResolvedValue({ _id: "newuser123" });

      await signUp(req as Request, res as Response);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          pseudo: "testuser",
          email: "test@test.com",
          password: "Password1",
          pole: "Direction",
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ user: "newuser123" });
    });

    it("should auto-assign hotline role when pole is Hotline", async () => {
      req.body = {
        pseudo: "hotlineuser",
        email: "hotline@test.com",
        password: "Password1",
        pole: "Hotline",
      };
      mockCreate.mockResolvedValue({ _id: "hotline123" });

      await signUp(req as Request, res as Response);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          pole: "Hotline",
          roles: [Role.USER, Role.HOTLINE],
        }),
      );
    });

    it("should NOT set role when pole is not Hotline", async () => {
      req.body = {
        pseudo: "normaluser",
        email: "normal@test.com",
        password: "Password1",
        pole: "Direction",
      };
      mockCreate.mockResolvedValue({ _id: "normal123" });

      await signUp(req as Request, res as Response);

      const createArg = mockCreate.mock.calls[0][0];
      expect(createArg.role).toBeUndefined();
      expect(createArg.roles).toEqual([Role.USER]);
    });

    it("should return 400 with errors on validation failure", async () => {
      req.body = { pseudo: "ab", email: "bad", password: "1" };
      const validationError = new Error("validation failed");
      (validationError as unknown as Record<string, unknown>).code = undefined;
      mockCreate.mockRejectedValue(validationError);

      await signUp(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: expect.any(Object) });
    });

    it("should return 400 with duplicate pseudo error", async () => {
      req.body = {
        pseudo: "existing",
        email: "new@test.com",
        password: "Password1",
      };
      const dupError = new Error("duplicate") as Error & {
        code: number;
        keyValue: Record<string, unknown>;
      };
      dupError.code = 11000;
      dupError.keyValue = { pseudo: "existing" };
      mockCreate.mockRejectedValue(dupError);

      await signUp(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── signIn ────────────────────────────────────────────
  describe("signIn", () => {
    it("should login, set cookie, and return user ID + role", async () => {
      req.body = { email: "test@test.com", password: "Password1" };
      mockLogin.mockResolvedValue({
        _id: "user123",
        pseudo: "testuser",
        roles: [Role.USER],
      });

      await signIn(req as Request, res as Response);

      expect(mockLogin).toHaveBeenCalledWith("test@test.com", "Password1");
      expect(res.cookie).toHaveBeenCalledWith(
        "jwt",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: "lax",
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: "user123",
        roles: [Role.USER],
      });
    });

    it("should return 400 on invalid credentials", async () => {
      req.body = { email: "test@test.com", password: "wrong" };
      mockLogin.mockRejectedValue(new Error("Mot de passe incorrect"));

      await signIn(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: expect.any(Object) });
    });

    it("should return 400 on unknown email", async () => {
      req.body = { email: "unknown@test.com", password: "Password1" };
      mockLogin.mockRejectedValue(new Error("Email inconnu"));

      await signIn(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── logout ────────────────────────────────────────────
  describe("logout", () => {
    it("should clear the JWT cookie and return 200", async () => {
      await logout(req as Request, res as Response);

      expect(res.cookie).toHaveBeenCalledWith("jwt", "", { maxAge: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Déconnexion réussie",
      });
    });
  });
});
