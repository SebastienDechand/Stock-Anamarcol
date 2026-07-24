import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCreate = vi.fn();
const mockInsertMany = vi.fn();

vi.mock("../models/history.model", () => ({
  __esModule: true,
  default: {
    create: (...args: unknown[]) => mockCreate(...args),
    insertMany: (...args: unknown[]) => mockInsertMany(...args),
  },
}));

import {
  logItemCreate,
  logItemDelete,
  logItemChanges,
} from "../utils/history.utils";

describe("history.utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // #region logItemCreate
  describe("logItemCreate", () => {
    it("should create a history entry with action 'create'", async () => {
      mockCreate.mockResolvedValue({});

      await logItemCreate("item123", "admin");

      expect(mockCreate).toHaveBeenCalledWith({
        itemId: "item123",
        action: "create",
        userName: "admin",
      });
    });

    it("should not throw on DB error", async () => {
      mockCreate.mockRejectedValue(new Error("DB error"));

      await expect(logItemCreate("item123", "admin")).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });
  // #endregion

  // #region logItemDelete
  describe("logItemDelete", () => {
    it("should create a history entry with action 'delete'", async () => {
      mockCreate.mockResolvedValue({});

      await logItemDelete("item456", "Clavier Logitech", "admin");

      expect(mockCreate).toHaveBeenCalledWith({
        itemId: "item456",
        action: "delete",
        field: "name",
        oldValue: "Clavier Logitech",
        userName: "admin",
      });
    });

    it("should not throw on DB error", async () => {
      mockCreate.mockRejectedValue(new Error("DB error"));

      await expect(
        logItemDelete("item456", "Test", "admin"),
      ).resolves.toBeUndefined();
    });
  });
  // #endregion

  // #region logItemChanges
  describe("logItemChanges", () => {
    it("should track quantity change", async () => {
      mockInsertMany.mockResolvedValue([]);

      await logItemChanges(
        "item789",
        { quantity: 10 },
        { quantity: 5 },
        "admin",
      );

      expect(mockInsertMany).toHaveBeenCalledWith([
        {
          itemId: "item789",
          action: "quantity_change",
          field: "quantity",
          oldValue: "10",
          newValue: "5",
          userName: "admin",
        },
      ]);
    });

    it("should track tracked field changes", async () => {
      mockInsertMany.mockResolvedValue([]);

      await logItemChanges(
        "item789",
        { name: "Old Name", supplier: "Amazon" },
        { name: "New Name" },
        "admin",
      );

      expect(mockInsertMany).toHaveBeenCalledWith([
        {
          itemId: "item789",
          action: "update",
          field: "name",
          oldValue: "Old Name",
          newValue: "New Name",
          userName: "admin",
        },
      ]);
    });

    it("should track both quantity and field changes together", async () => {
      mockInsertMany.mockResolvedValue([]);

      await logItemChanges(
        "item789",
        { quantity: 3, status: "Neuf" },
        { quantity: 8, status: "SAV" },
        "admin",
      );

      expect(mockInsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            action: "quantity_change",
            field: "quantity",
          }),
          expect.objectContaining({ action: "update", field: "status" }),
        ]),
      );
    });

    it("should not insert anything when no changes detected", async () => {
      await logItemChanges(
        "item789",
        { quantity: 5, name: "Same" },
        { quantity: 5, name: "Same" },
        "admin",
      );

      expect(mockInsertMany).not.toHaveBeenCalled();
    });

    it("should ignore untracked fields", async () => {
      await logItemChanges(
        "item789",
        { randomField: "old" },
        { randomField: "new" },
        "admin",
      );

      expect(mockInsertMany).not.toHaveBeenCalled();
    });

    it("should not throw on DB error", async () => {
      mockInsertMany.mockRejectedValue(new Error("DB error"));

      await expect(
        logItemChanges("item789", { quantity: 1 }, { quantity: 2 }, "admin"),
      ).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });
  // #endregion
});
