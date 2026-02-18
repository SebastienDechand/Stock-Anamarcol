import { Response } from "express";

const mockCreate = jest.fn();
const mockFind = jest.fn();

jest.mock("../models/audit.model", () => ({
  __esModule: true,
  default: {
    create: (...args: unknown[]) => mockCreate(...args),
    find: (...args: unknown[]) => mockFind(...args),
  },
}));

import { logEvent, getRecentEvents } from "../utils/audit.utils";

describe("audit.utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── logEvent ──────────────────────────────────────────
  describe("logEvent", () => {
    it("should create an audit entry with all fields", async () => {
      mockCreate.mockResolvedValue({});

      await logEvent("update", "item", "abc123", "admin", { foo: "bar" });

      expect(mockCreate).toHaveBeenCalledWith({
        action: "update",
        entity: "item",
        entityId: "abc123",
        userName: "admin",
        details: { foo: "bar" },
      });
    });

    it("should create an entry with optional fields undefined", async () => {
      mockCreate.mockResolvedValue({});

      await logEvent("logout", "user");

      expect(mockCreate).toHaveBeenCalledWith({
        action: "logout",
        entity: "user",
        entityId: undefined,
        userName: undefined,
        details: undefined,
      });
    });

    it("should not throw when AuditModel.create fails", async () => {
      mockCreate.mockRejectedValue(new Error("DB error"));

      await expect(
        logEvent("login", "user", "id1", "admin"),
      ).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith(
        "Audit log error:",
        expect.any(Error),
      );
    });
  });

  // ─── getRecentEvents ──────────────────────────────────
  describe("getRecentEvents", () => {
    it("should query with default limit and empty filter", async () => {
      const mockLean = jest.fn().mockResolvedValue([{ action: "login" }]);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      mockFind.mockReturnValue({ sort: mockSort });

      const result = await getRecentEvents();

      expect(mockFind).toHaveBeenCalledWith({});
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockLimit).toHaveBeenCalledWith(200);
      expect(result).toEqual([{ action: "login" }]);
    });

    it("should apply custom limit and filter", async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      mockFind.mockReturnValue({ sort: mockSort });

      await getRecentEvents(50, { entity: "item" });

      expect(mockFind).toHaveBeenCalledWith({ entity: "item" });
      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });
});
