const UserModel = require("../models/user.model");
const {
  getAllUsers,
  userInfo,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

jest.mock("../models/user.model");

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
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
      UserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });

      await getAllUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
  });

  // ─── userInfo ──────────────────────────────────────────
  describe("userInfo", () => {
    it("should return 400 when ID is invalid", () => {
      req.params.id = "invalid";
      userInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return user info", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      const mockUser = { _id: "507f1f77bcf86cd799439011", pseudo: "test" };

      UserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockImplementation((cb) => {
            cb(mockUser);
            return { catch: jest.fn() };
          }),
        }),
      });

      userInfo(req, res);
    });
  });

  // ─── deleteUser ────────────────────────────────────────
  describe("deleteUser", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params.id = "invalid";
      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete a user successfully", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      UserModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Sucessfully deleted.",
      });
    });
  });

  // ─── updateUser ────────────────────────────────────────
  describe("updateUser", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params.id = "invalid";
      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when user does not exist", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      UserModel.findById.mockResolvedValue(null);

      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update a user successfully", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      req.body = { email: "new@test.com", poste: "Dev" };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "old@test.com",
        save: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          email: "new@test.com",
          poste: "Dev",
        }),
      };
      UserModel.findById.mockResolvedValue(mockUser);

      await updateUser(req, res);
      expect(mockUser.email).toBe("new@test.com");
      expect(mockUser.poste).toBe("Dev");
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
