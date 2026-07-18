import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

const mockAuditModel = vi.hoisted(() => ({
  deleteMany: vi.fn(),
}));
const mockHistoryModel = vi.hoisted(() => ({
  find: vi.fn(),
  deleteMany: vi.fn(),
}));
const mockItemModel = vi.hoisted(() => ({
  find: vi.fn(),
}));
const mockContactModel = vi.hoisted(() => ({
  find: vi.fn(),
}));
const mockUserModel = vi.hoisted(() => ({
  find: vi.fn(),
}));

vi.mock("../models/audit.model", () => ({
  __esModule: true,
  default: mockAuditModel,
}));
vi.mock("../models/history.model", () => ({
  __esModule: true,
  default: mockHistoryModel,
}));
vi.mock("../models/item.model", () => ({
  __esModule: true,
  default: mockItemModel,
}));
vi.mock("../models/contact.model", () => ({
  __esModule: true,
  default: mockContactModel,
}));
vi.mock("../models/user.model", () => ({
  __esModule: true,
  default: mockUserModel,
}));
vi.mock("../utils/audit.utils", () => ({
  getRecentEvents: vi.fn().mockResolvedValue([]),
  logEvent: vi.fn().mockResolvedValue(undefined),
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
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
    };
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── getHistory ──────────────────────────────────────
  describe("getHistory", () => {
    it("should return merged events with status 200", async () => {
      mockHistoryModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockItemModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });
      mockContactModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });
      mockUserModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });

      await getHistory(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should use custom limit from query", async () => {
      req.query = { limit: "50" };
      mockHistoryModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockItemModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
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

    it("should include item name in itemEvents response", async () => {
      const itemId = "507f1f77bcf86cd799439011";
      const historyEntry = {
        _id: "h1",
        action: "update",
        field: "quantity",
        oldValue: "10",
        newValue: "20",
        itemId,
        userName: "testuser",
        createdAt: "2026-07-18T00:00:00Z",
      };
      const itemData = {
        _id: itemId,
        name: "Test Item",
      };

      mockHistoryModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([historyEntry]),
          }),
        }),
      });
      mockItemModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([itemData]),
        }),
      });
      mockContactModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });
      mockUserModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });

      await getHistory(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData).toHaveLength(1);
      expect(responseData[0].details.name).toBe("Test Item");
      expect(responseData[0].details.entityName).toBe("Test Item");
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
