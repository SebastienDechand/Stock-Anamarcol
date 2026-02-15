import { Request, Response } from "express";

const mockItemModel = {
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
};

jest.mock("../models/item.model", () => ({
  __esModule: true,
  default: mockItemModel,
}));

jest.mock("../utils/history.utils", () => ({
  logItemCreate: jest.fn(),
  logItemChanges: jest.fn(),
  logItemDelete: jest.fn(),
}));

jest.mock("../utils/audit.utils", () => ({
  logEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../controllers/stats.controller", () => ({
  invalidateStatsCache: jest.fn(),
}));

import {
  itemInfo,
  readItem,
  createItem,
  updateItem,
  deleteItem,
  prepaBatch,
} from "../controllers/item.controller";

describe("Item Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
    };
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

  // ─── itemInfo ──────────────────────────────────────────
  describe("itemInfo", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid-id" };
      await itemInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when item does not exist", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockItemModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await itemInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return the item when found", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        denomination: "Pièce A",
        quantite: 10,
        fournisseur: "Fournisseur1",
        etat: "Neuf",
      };
      mockItemModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      await itemInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockItem);
    });
  });

  // ─── readItem ──────────────────────────────────────────
  describe("readItem", () => {
    it("should return paginated items", async () => {
      req.query = { page: "1", limit: "10" };
      const mockItems = [{ denomination: "Test" }];

      mockItemModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockItems),
            }),
          }),
        }),
      });
      mockItemModel.countDocuments.mockResolvedValue(1);

      await readItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          items: mockItems,
          total: 1,
          page: 1,
          totalPages: 1,
        }),
      );
    });

    it("should apply the search filter", async () => {
      req.query = { search: "piece", page: "1", limit: "10" };

      mockItemModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockItemModel.countDocuments.mockResolvedValue(0);

      await readItem(req as Request, res as Response);
      expect(mockItemModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          denomination: { $regex: "piece", $options: "i" },
        }),
      );
    });

    it("should filter by low stock", async () => {
      req.query = { lowStock: "true", page: "1", limit: "10" };

      mockItemModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockItemModel.countDocuments.mockResolvedValue(0);

      await readItem(req as Request, res as Response);
      expect(mockItemModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          quantite: { $lt: 5 },
        }),
      );
    });
  });

  // ─── createItem ────────────────────────────────────────
  describe("createItem", () => {
    it("should create an item successfully", async () => {
      req.body = {
        denomination: "Pièce B",
        quantite: "5",
        fournisseur: "Fournisseur1",
        etat: "Neuf",
        posterId: "user123",
        modifierName: "admin",
      };

      const mockCreated = { ...req.body, _id: "abc123", quantite: 5 };
      mockItemModel.create.mockResolvedValue(mockCreated);

      await createItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item: mockCreated });
    });

    it("should return 400 when creation fails", async () => {
      req.body = { denomination: "" };
      mockItemModel.create.mockRejectedValue(
        new Error("denomination required"),
      );

      await createItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── updateItem ────────────────────────────────────────
  describe("updateItem", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "bad-id" };
      await updateItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when item does not exist", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockItemModel.findById.mockResolvedValue(null);

      await updateItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update an item successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { denomination: "Updated", quantite: 15 };

      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        denomination: "Original",
        quantite: 10,
        toObject: jest.fn().mockReturnValue({
          _id: "507f1f77bcf86cd799439011",
          denomination: "Original",
          quantite: 10,
        }),
        save: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          denomination: "Updated",
          quantite: 15,
        }),
      };
      mockItemModel.findById.mockResolvedValue(mockItem);

      await updateItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should prevent negative quantity", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { quantite: -5 };

      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        quantite: 10,
        toObject: jest.fn().mockReturnValue({
          _id: "507f1f77bcf86cd799439011",
          quantite: 10,
        }),
        save: jest.fn().mockImplementation(function (this: {
          quantite: number;
        }) {
          return Promise.resolve(this);
        }),
      };
      mockItemModel.findById.mockResolvedValue(mockItem);

      await updateItem(req as Request, res as Response);
      expect(mockItem.quantite).toBe(0);
    });
  });

  // ─── deleteItem ────────────────────────────────────────
  describe("deleteItem", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "bad-id" };
      await deleteItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete an item successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockItemModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          denomination: "Test",
        }),
      });
      mockItemModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await deleteItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Sucessfully deleted.",
      });
    });
  });

  // ─── prepaBatch ──────────────────────────────────────
  describe("prepaBatch", () => {
    it("should return 400 when prepa is invalid", async () => {
      req.body = { prepa: "invalid", operation: "decrement" };
      await prepaBatch(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Prépa invalide" });
    });

    it("should return 400 when operation is invalid", async () => {
      req.body = { prepa: "prepaCG", operation: "multiply" };
      await prepaBatch(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Opération invalide" });
    });

    it("should decrement quantities for matching items", async () => {
      req.body = { prepa: "prepaCG", operation: "decrement" };

      const mockItems = [
        {
          _id: "item1",
          denomination: "Pièce A",
          quantite: 10,
          toObject: jest.fn().mockReturnValue({ denomination: "Pièce A", quantite: 10 }),
          save: jest.fn().mockResolvedValue(true),
        },
      ];
      mockItemModel.find.mockResolvedValue(mockItems);

      await prepaBatch(req as Request, res as Response);

      expect(mockItems[0].quantite).toBe(9);
      expect(mockItems[0].save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ updated: 1 }),
      );
    });

    it("should apply delta of 4 for cassette items in prepaCG", async () => {
      req.body = { prepa: "prepaCG", operation: "decrement" };

      const mockItems = [
        {
          _id: "item1",
          denomination: "Cassette HV",
          quantite: 10,
          toObject: jest.fn().mockReturnValue({ denomination: "Cassette HV", quantite: 10 }),
          save: jest.fn().mockResolvedValue(true),
        },
      ];
      mockItemModel.find.mockResolvedValue(mockItems);

      await prepaBatch(req as Request, res as Response);

      expect(mockItems[0].quantite).toBe(6);
    });

    it("should not go below 0 on decrement", async () => {
      req.body = { prepa: "prepaTPV", operation: "decrement" };

      const mockItems = [
        {
          _id: "item1",
          denomination: "Pièce A",
          quantite: 0,
          toObject: jest.fn().mockReturnValue({ denomination: "Pièce A", quantite: 0 }),
          save: jest.fn().mockResolvedValue(true),
        },
      ];
      mockItemModel.find.mockResolvedValue(mockItems);

      await prepaBatch(req as Request, res as Response);

      expect(mockItems[0].quantite).toBe(0);
      expect(mockItems[0].save).not.toHaveBeenCalled();
    });
  });
});
