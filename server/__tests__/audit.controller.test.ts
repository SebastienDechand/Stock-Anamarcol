import { Request, Response } from "express";

const mockAuditModel = {
  deleteMany: jest.fn(),
};
const mockHistoryModel = {
  find: jest.fn(),
  deleteMany: jest.fn(),
};
const mockItemModel = {
  find: jest.fn(),
};
const mockContactModel = {
  find: jest.fn(),
};
const mockUserModel = {
  find: jest.fn(),
};

jest.mock("../models/audit.model", () => ({
  __esModule: true,
  default: mockAuditModel,
}));
jest.mock("../models/history.model", () => ({
  __esModule: true,
  default: mockHistoryModel,
}));
jest.mock("../models/item.model", () => ({
  __esModule: true,
  default: mockItemModel,
}));
jest.mock("../models/contact.model", () => ({
  __esModule: true,
  default: mockContactModel,
}));
jest.mock("../models/user.model", () => ({
  __esModule: true,
  default: mockUserModel,
}));
jest.mock("../utils/audit.utils", () => ({
  getRecentEvents: jest.fn().mockResolvedValue([]),
  logEvent: jest.fn().mockResolvedValue(undefined),
}));

import {
  getHistory,
  purgeAllHistoryAndAudit,
} from "../controllers/audit.controller";

describe("Audit Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { query: {}, body: {} };
    res = {
      locals: { user: { pseudo: "admin" } },
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn() as unknown as Response["json"],
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── getHistory ──────────────────────────────────────
  describe("getHistory", () => {
    it("should return merged events with status 200", async () => {
      mockHistoryModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockItemModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
      mockContactModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      await getHistory(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should use custom limit from query", async () => {
      req.query = { limit: "50" };
      mockHistoryModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockItemModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      await getHistory(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on error", async () => {
      mockHistoryModel.find.mockImplementation(() => {
        throw new Error("DB error");
      });

      await getHistory(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Erreur interne du serveur",
      });
    });
  });

  // ─── purgeAllHistoryAndAudit ─────────────────────────
  describe("purgeAllHistoryAndAudit", () => {
    it("should delete all audit and history docs", async () => {
      mockAuditModel.deleteMany.mockResolvedValue({ deletedCount: 10 });
      mockHistoryModel.deleteMany.mockResolvedValue({ deletedCount: 5 });

      await purgeAllHistoryAndAudit(req as Request, res as Response);

      expect(mockAuditModel.deleteMany).toHaveBeenCalledWith({});
      expect(mockHistoryModel.deleteMany).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        deletedAudit: 10,
        deletedHistory: 5,
      });
    });

    it("should use 'unknown' when no user in locals", async () => {
      res.locals = {};
      mockAuditModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
      mockHistoryModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

      await purgeAllHistoryAndAudit(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on error", async () => {
      mockAuditModel.deleteMany.mockRejectedValue(new Error("DB error"));

      await purgeAllHistoryAndAudit(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Erreur interne du serveur",
      });
    });
  });
});
