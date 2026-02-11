const jwt = require("jsonwebtoken");

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

  return UserModel;
});

const {
  checkUser,
  requireAuth,
  requireAdmin,
} = require("../middleware/auth.middleware");

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { cookies: {} };
    res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ─── checkUser ─────────────────────────────────────────
  describe("checkUser", () => {
    it("should call next with user = null when no token", () => {
      checkUser(req, res, next);
      expect(res.locals.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it("should decode the token and load the user", async () => {
      const token = jwt.sign(
        { id: "507f1f77bcf86cd799439011" },
        process.env.TOKEN_SECRET,
      );
      req.cookies.jwt = token;

      await checkUser(req, res, next);
      // Wait for async resolution
      await new Promise((r) => setTimeout(r, 50));

      expect(next).toHaveBeenCalled();
    });

    it("should set user to null when token is invalid", async () => {
      req.cookies.jwt = "invalid-token";

      await checkUser(req, res, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.locals.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });

  // ─── requireAuth ───────────────────────────────────────
  describe("requireAuth", () => {
    it("should return 401 when no token is provided", () => {
      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentification requise",
      });
    });

    it("should return 401 when token is invalid", async () => {
      req.cookies.jwt = "bad-token";

      await requireAuth(req, res, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should call next when token is valid", async () => {
      const token = jwt.sign(
        { id: "507f1f77bcf86cd799439011" },
        process.env.TOKEN_SECRET,
      );
      req.cookies.jwt = token;

      await requireAuth(req, res, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(next).toHaveBeenCalled();
    });
  });

  // ─── requireAdmin ──────────────────────────────────────
  describe("requireAdmin", () => {
    it("should return 401 when no token is provided", () => {
      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 401 when token is invalid", async () => {
      req.cookies.jwt = "invalid";

      await requireAdmin(req, res, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
