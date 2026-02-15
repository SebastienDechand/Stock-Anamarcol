import { Request, Response } from "express";

const mockUserModel = {
  find: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn(),
};

jest.mock("../models/user.model", () => ({
  __esModule: true,
  default: mockUserModel,
}));

jest.mock("../utils/audit.utils", () => ({
  logEvent: jest.fn().mockResolvedValue(undefined),
}));

import {
  getAllUsers,
  userInfo,
  updateUser,
  deleteUser,
  setRole,
} from "../controllers/user.controller";

describe("User Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      locals: { user: { pseudo: "admin" } },
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn() as unknown as Response["json"],
      send: jest.fn() as unknown as Response["send"],
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── getAllUsers ────────────────────────────────────────
  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { _id: "1", pseudo: "user1" },
        { _id: "2", pseudo: "user2" },
      ];
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
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
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockImplementation((cb: (user: unknown) => void) => {
            cb(mockUser);
            return { catch: jest.fn() };
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
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
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
        save: jest.fn().mockResolvedValue({
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
  });

  // ─── setRole ─────────────────────────────────────────
  describe("setRole", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      req.body = { role: "admin" };
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
      req.body = { role: "admin" };
      mockUserModel.findById.mockResolvedValue(null);

      await setRole(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update the role successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { role: "admin" };
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        role: "user",
        save: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          role: "admin",
        }),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await setRole(req as Request, res as Response);
      expect(mockUser.role).toBe("admin");
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
