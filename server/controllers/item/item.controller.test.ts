import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

const mockItemModel = vi.hoisted(() => ({
  findById: vi.fn(),
  find: vi.fn(),
  countDocuments: vi.fn(),
  create: vi.fn(),
  deleteOne: vi.fn(),
}));

vi.mock("../../models/item.model", () => ({
  __esModule: true,
  default: mockItemModel,
}));

vi.mock("../../utils/history/history.utils", () => ({
  logItemCreate: vi.fn(),
  logItemChanges: vi.fn(),
  logItemDelete: vi.fn(),
}));

vi.mock("../../utils/audit/audit.utils", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../stats/stats.controller", () => ({
  invalidateStatsCache: vi.fn(),
}));

import {
  itemInfo,
  readItem,
  createItem,
  updateItem,
  deleteItem,
  preparationBatch,
} from "./item.controller";

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
      locals: { user: { username: "admin" } },
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
      send: vi.fn() as unknown as Response["send"],
    };
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // #region itemInfo
  describe("itemInfo", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid-id" };
      await itemInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when item does not exist", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockItemModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      await itemInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return the item when found", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        name: "Pièce A",
        quantity: 10,
        supplier: "Fournisseur1",
        status: "Neuf",
      };
      mockItemModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockItem),
      });

      await itemInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockItem);
    });
  });
  // #endregion

  // #region readItem
  describe("readItem", () => {
    it("should return paginated items", async () => {
      req.query = { page: "1", limit: "10" };
      const mockItems = [{ name: "Test" }];

      mockItemModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockItems),
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
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockItemModel.countDocuments.mockResolvedValue(0);

      await readItem(req as Request, res as Response);
      expect(mockItemModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          name: { $regex: "piece", $options: "i" },
        }),
      );
    });

    it("should filter by low stock", async () => {
      req.query = { lowStock: "true", page: "1", limit: "10" };

      mockItemModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockItemModel.countDocuments.mockResolvedValue(0);

      await readItem(req as Request, res as Response);
      expect(mockItemModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: { $lt: 5 },
        }),
      );
    });
  });
  // #endregion

  // #region createItem
  describe("createItem", () => {
    it("should create an item successfully", async () => {
      req.body = {
        name: "Pièce B",
        quantity: "5",
        supplier: "Fournisseur1",
        status: "Neuf",
        posterId: "user123",
        modifierName: "admin",
      };

      const mockCreated = { ...req.body, _id: "abc123", quantity: 5 };
      mockItemModel.create.mockResolvedValue(mockCreated);

      await createItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item: mockCreated });
    });

    it("should return 400 when creation fails", async () => {
      req.body = { name: "" };
      mockItemModel.create.mockRejectedValue(
        new Error("name required"),
      );

      await createItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
  // #endregion

  // #region updateItem
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
      req.body = { name: "Updated", quantity: 15 };

      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        name: "Original",
        quantity: 10,
        toObject: vi.fn().mockReturnValue({
          _id: "507f1f77bcf86cd799439011",
          name: "Original",
          quantity: 10,
        }),
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          name: "Updated",
          quantity: 15,
        }),
      };
      mockItemModel.findById.mockResolvedValue(mockItem);

      await updateItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 403 when a non-admin tries to change supplier or status", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { supplier: "Amazon" };
      res.locals = { user: { username: "user", roles: ["user"] } };

      await updateItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockItemModel.findById).not.toHaveBeenCalled();
    });

    it("should allow an admin to change supplier or status", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { status: "RMA" };
      res.locals = { user: { username: "admin", roles: ["admin"] } };

      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        status: "NEW",
        toObject: vi.fn().mockReturnValue({
          _id: "507f1f77bcf86cd799439011",
          status: "NEW",
        }),
        save: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          status: "RMA",
        }),
      };
      mockItemModel.findById.mockResolvedValue(mockItem);

      await updateItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should prevent negative quantity", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { quantity: -5 };

      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        quantity: 10,
        toObject: vi.fn().mockReturnValue({
          _id: "507f1f77bcf86cd799439011",
          quantity: 10,
        }),
        save: vi.fn().mockImplementation(function (this: {
          quantity: number;
        }) {
          return Promise.resolve(this);
        }),
      };
      mockItemModel.findById.mockResolvedValue(mockItem);

      await updateItem(req as Request, res as Response);
      expect(mockItem.quantity).toBe(0);
    });
  });
  // #endregion

  // #region deleteItem
  describe("deleteItem", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "bad-id" };
      await deleteItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete an item successfully", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockItemModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          name: "Test",
        }),
      });
      mockItemModel.deleteOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await deleteItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Successfully deleted",
        code: "DELETED",
      });
    });
  });
  // #endregion

  // #region preparationBatch
  describe("preparationBatch", () => {
    it("should return 400 when preparation is invalid", async () => {
      req.body = { preparation: "invalid", operation: "decrement" };
      await preparationBatch(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid preparation",
        code: "INVALID_PREPARATION",
      });
    });

    it("should return 400 when operation is invalid", async () => {
      req.body = { preparation: "cgKit", operation: "multiply" };
      await preparationBatch(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid operation",
        code: "INVALID_OPERATION",
      });
    });

    it("should decrement quantities for matching items", async () => {
      req.body = { preparation: "cgKit", operation: "decrement" };

      const mockItems = [
        {
          _id: "item1",
          name: "Pièce A",
          quantity: 10,
          toObject: vi.fn().mockReturnValue({ name: "Pièce A", quantity: 10 }),
          save: vi.fn().mockResolvedValue(true),
        },
      ];
      mockItemModel.find.mockResolvedValue(mockItems);

      await preparationBatch(req as Request, res as Response);

      expect(mockItems[0].quantity).toBe(9);
      expect(mockItems[0].save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ updated: 1 }),
      );
    });

    it("should apply delta of 4 for cassette items in cgKit", async () => {
      req.body = { preparation: "cgKit", operation: "decrement" };

      const mockItems = [
        {
          _id: "item1",
          name: "Cassette HV",
          quantity: 10,
          toObject: vi.fn().mockReturnValue({ name: "Cassette HV", quantity: 10 }),
          save: vi.fn().mockResolvedValue(true),
        },
      ];
      mockItemModel.find.mockResolvedValue(mockItems);

      await preparationBatch(req as Request, res as Response);

      expect(mockItems[0].quantity).toBe(6);
    });

    it("should not go below 0 on decrement", async () => {
      req.body = { preparation: "tpvKit", operation: "decrement" };

      const mockItems = [
        {
          _id: "item1",
          name: "Pièce A",
          quantity: 0,
          toObject: vi.fn().mockReturnValue({ name: "Pièce A", quantity: 0 }),
          save: vi.fn().mockResolvedValue(true),
        },
      ];
      mockItemModel.find.mockResolvedValue(mockItems);

      await preparationBatch(req as Request, res as Response);

      expect(mockItems[0].quantity).toBe(0);
      expect(mockItems[0].save).not.toHaveBeenCalled();
    });
  });
  // #endregion
});
