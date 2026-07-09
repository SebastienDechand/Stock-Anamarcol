import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { Role } from "../constants";

const mockUserModel = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  deleteOne: vi.fn(),
}));

vi.mock("../models/user.model", () => ({
  __esModule: true,
  default: mockUserModel,
}));

vi.mock("../utils/audit.utils", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

import {
  getAllUsers,
  userInfo,
  updateUser,
  deleteUser,
  setRole,
  setRoles,
} from "../controllers/user.controller";

describe("User Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      locals: { user: { _id: "admin-id", pseudo: "admin", roles: [Role.ADMIN] } },
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
      send: vi.fn() as unknown as Response["send"],
    };
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── getAllUsers ────────────────────────────────────────
  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { _id: "1", pseudo: "user1" },
        { _id: "2", pseudo: "user2" },
      ];
      mockUserModel.find.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUsers),
      });

      await getAllUsers(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
  });

  // ─── userInfo ──────────────────────────────────────────
  describe("userInfo", () => {
    it("should return 400 when ID is invalid", () => {
      req.params = { id: "invalid" };
      userInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return user info", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      const mockUser = { _id: "507f1f77bcf86cd799439011", pseudo: "test" };

      mockUserModel.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          then: vi.fn().mockImplementation((cb: (user: unknown) => void) => {
            cb(mockUser);
            return { catch: vi.fn() };
          }),
        }),
      });

      userInfo(req as Request, res as Response);
    });
  });

  // ─── deleteUser ────────────────────────────────────────
  describe("deleteUser", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      await deleteUser(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete a user successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockUserModel.deleteOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await deleteUser(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Sucessfully deleted.",
      });
    });
  });

  // ─── updateUser ────────────────────────────────────────
  describe("updateUser", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      await updateUser(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when user does not exist", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockUserModel.findById.mockResolvedValue(null);

      await updateUser(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update a user successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { email: "new@test.com", poste: "Dev" };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "old@test.com",
        poste: "",
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          email: "new@test.com",
          poste: "Dev",
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await updateUser(req as Request, res as Response);
      expect(mockUser.email).toBe("new@test.com");
      expect(mockUser.poste).toBe("Dev");
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should auto-assign hotline role when pole set to Hotline", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { pole: "Hotline" };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "old@test.com",
        poste: "",
        pole: "",
        roles: [Role.USER],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          pole: "Hotline",
          roles: [Role.USER, Role.HOTLINE],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await updateUser(req as Request, res as Response);
      expect(mockUser.roles).toContain(Role.HOTLINE);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should downgrade hotline role when pole removed", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { pole: "Direction" };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "old@test.com",
        poste: "",
        pole: "Hotline",
        roles: [Role.USER, Role.HOTLINE],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          pole: "Direction",
          roles: [Role.USER],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await updateUser(req as Request, res as Response);
      expect(mockUser.roles).not.toContain(Role.HOTLINE);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should NOT override admin role when pole set to Hotline", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { pole: "Hotline" };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "admin@test.com",
        poste: "",
        pole: "Direction",
        roles: [Role.ADMIN, Role.USER],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          pole: "Hotline",
          roles: [Role.ADMIN, Role.USER],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await updateUser(req as Request, res as Response);
      expect(mockUser.roles).toContain(Role.ADMIN);
      expect(mockUser.roles).not.toContain(Role.HOTLINE);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should NOT override superadmin role when pole set to Hotline", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { pole: "Hotline" };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "super@test.com",
        poste: "",
        pole: "Direction",
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.USER],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          pole: "Hotline",
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.USER],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await updateUser(req as Request, res as Response);
      expect(mockUser.roles).toContain(Role.SUPERADMIN);
      expect(mockUser.roles).not.toContain(Role.HOTLINE);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should return 403 when a non-admin tries to update another user", async () => {
      res.locals!.user = { _id: "user-id", pseudo: "regular", roles: [Role.USER] };
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { numero: "0102030405" };

      await updateUser(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });

    it("should let a non-admin update their own numero and picture", async () => {
      res.locals!.user = { _id: "507f1f77bcf86cd799439011", pseudo: "regular", roles: [Role.USER] };
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { numero: "0102030405", picture: "https://cdn.example.com/pic.jpg" };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        numero: "",
        picture: "",
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          numero: "0102030405",
          picture: "https://cdn.example.com/pic.jpg",
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await updateUser(req as Request, res as Response);
      expect(mockUser.numero).toBe("0102030405");
      expect(mockUser.picture).toBe("https://cdn.example.com/pic.jpg");
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should silently ignore admin-only fields when a non-admin updates their own record", async () => {
      res.locals!.user = { _id: "507f1f77bcf86cd799439011", pseudo: "regular", roles: [Role.USER] };
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { email: "hacked@test.com", poste: "Boss", pole: "Hotline" };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "old@test.com",
        poste: "",
        pole: "",
        roles: [Role.USER],
        save: vi.fn().mockResolvedValue({}),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await updateUser(req as Request, res as Response);
      expect(mockUser.email).toBe("old@test.com");
      expect(mockUser.poste).toBe("");
      expect(mockUser.pole).toBe("");
      expect(mockUser.roles).not.toContain(Role.HOTLINE);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  // ─── setRole ─────────────────────────────────────────
  describe("setRole", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      req.body = { role: Role.ADMIN };
      await setRole(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when role is invalid", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { role: "hacker" };
      await setRole(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Role invalide" });
    });

    it("should return 404 when user not found", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { role: Role.ADMIN };
      mockUserModel.findById.mockResolvedValue(null);

      await setRole(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update the role successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { role: Role.ADMIN };
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        roles: [Role.USER],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          roles: [Role.ADMIN, Role.USER],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await setRole(req as Request, res as Response);
      expect(mockUser.roles).toContain(Role.ADMIN);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should update the role to hotline successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { role: Role.HOTLINE };
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        roles: [Role.USER],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          roles: [Role.USER, Role.HOTLINE],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await setRole(req as Request, res as Response);
      expect(mockUser.roles).toContain(Role.HOTLINE);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should update the role to superadmin successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { role: Role.SUPERADMIN };
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        roles: [Role.USER],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.USER],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await setRole(req as Request, res as Response);
      expect(mockUser.roles).toContain(Role.SUPERADMIN);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should update the role to user successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { role: Role.USER };
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        roles: [Role.ADMIN, Role.USER],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          roles: [Role.USER],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await setRole(req as Request, res as Response);
      expect(mockUser.roles).toEqual([Role.USER]);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on internal error", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { role: Role.ADMIN };
      mockUserModel.findById.mockRejectedValue(new Error("DB failure"));

      await setRole(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── setRoles ─────────────────────────────────────────
  describe("setRoles", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      req.body = { roles: [Role.ADMIN, Role.USER] };
      await setRoles(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when roles is not an array", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { roles: Role.ADMIN };
      await setRoles(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Roles invalides" });
    });

    it("should return 400 when roles array contains invalid values", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { roles: [Role.USER, "hacker"] };
      await setRoles(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when user not found", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { roles: [Role.ADMIN, Role.USER] };
      mockUserModel.findById.mockResolvedValue(null);
      await setRoles(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update multiple roles successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { roles: [Role.ADMIN, Role.USER] };
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        roles: [Role.USER],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          roles: [Role.ADMIN, Role.USER],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await setRoles(req as Request, res as Response);
      expect(mockUser.roles).toEqual([Role.ADMIN, Role.USER]);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ roles: [Role.ADMIN, Role.USER] }),
      );
    });

    it("should assign monteur role successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { roles: [Role.USER, Role.MONTEUR] };
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        roles: [Role.USER],
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          roles: [Role.USER, Role.MONTEUR],
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await setRoles(req as Request, res as Response);
      expect(mockUser.roles).toContain(Role.MONTEUR);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on internal error", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { roles: [Role.USER] };
      mockUserModel.findById.mockRejectedValue(new Error("DB failure"));
      await setRoles(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
