const mockCreate = jest.fn();
const mockInsertMany = jest.fn();

jest.mock("../models/history.model", () => ({
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
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── logItemCreate ─────────────────────────────────────
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

  // ─── logItemDelete ─────────────────────────────────────
  describe("logItemDelete", () => {
    it("should create a history entry with action 'delete'", async () => {
      mockCreate.mockResolvedValue({});

      await logItemDelete("item456", "Clavier Logitech", "admin");

      expect(mockCreate).toHaveBeenCalledWith({
        itemId: "item456",
        action: "delete",
        field: "denomination",
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

  // ─── logItemChanges ────────────────────────────────────
  describe("logItemChanges", () => {
    it("should track quantity change", async () => {
      mockInsertMany.mockResolvedValue([]);

      await logItemChanges(
        "item789",
        { quantite: 10 },
        { quantite: 5 },
        "admin",
      );

      expect(mockInsertMany).toHaveBeenCalledWith([
        {
          itemId: "item789",
          action: "quantity_change",
          field: "quantite",
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
        { denomination: "Old Name", fournisseur: "Amazon" },
        { denomination: "New Name" },
        "admin",
      );

      expect(mockInsertMany).toHaveBeenCalledWith([
        {
          itemId: "item789",
          action: "update",
          field: "denomination",
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
        { quantite: 3, etat: "Neuf" },
        { quantite: 8, etat: "SAV" },
        "admin",
      );

      expect(mockInsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            action: "quantity_change",
            field: "quantite",
          }),
          expect.objectContaining({ action: "update", field: "etat" }),
        ]),
      );
    });

    it("should not insert anything when no changes detected", async () => {
      await logItemChanges(
        "item789",
        { quantite: 5, denomination: "Same" },
        { quantite: 5, denomination: "Same" },
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
        logItemChanges("item789", { quantite: 1 }, { quantite: 2 }, "admin"),
      ).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
