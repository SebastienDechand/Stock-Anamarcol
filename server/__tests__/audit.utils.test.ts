import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Response } from "express";

const mockCreate = vi.fn();
const mockFind = vi.fn();

vi.mock("../models/audit.model", () => ({
  __esModule: true,
  default: {
    create: (...args: unknown[]) => mockCreate(...args),
    find: (...args: unknown[]) => mockFind(...args),
  },
}));

import { logEvent, getRecentEvents } from "../utils/audit.utils";

describe("audit.utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // #region logEvent
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
  // #endregion

  // #region getRecentEvents
  describe("getRecentEvents", () => {
    it("should query with default limit and empty filter", async () => {
      const mockLean = vi.fn().mockResolvedValue([{ action: "login" }]);
      const mockLimit = vi.fn().mockReturnValue({ lean: mockLean });
      const mockSort = vi.fn().mockReturnValue({ limit: mockLimit });
      mockFind.mockReturnValue({ sort: mockSort });

      const result = await getRecentEvents();

      expect(mockFind).toHaveBeenCalledWith({});
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockLimit).toHaveBeenCalledWith(200);
      expect(result).toEqual([{ action: "login" }]);
    });

    it("should apply custom limit and filter", async () => {
      const mockLean = vi.fn().mockResolvedValue([]);
      const mockLimit = vi.fn().mockReturnValue({ lean: mockLean });
      const mockSort = vi.fn().mockReturnValue({ limit: mockLimit });
      mockFind.mockReturnValue({ sort: mockSort });

      await getRecentEvents(50, { entity: "item" });

      expect(mockFind).toHaveBeenCalledWith({ entity: "item" });
      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });
  // #endregion
});
