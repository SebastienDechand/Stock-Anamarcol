const ItemModel = require("../models/item.model");
const {
  itemInfo,
  readItem,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/item.controller");

// Mock the ItemModel
jest.mock("../models/item.model");

describe("Item Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
    // Suppress console.error during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── itemInfo ──────────────────────────────────────────
  describe("itemInfo", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params.id = "invalid-id";
      await itemInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when item does not exist", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      ItemModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await itemInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return the item when found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        denomination: "Pièce A",
        quantite: 10,
        fournisseur: "Fournisseur1",
        etat: "Neuf",
      };
      ItemModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      await itemInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockItem);
    });
  });

  // ─── readItem ──────────────────────────────────────────
  describe("readItem", () => {
    it("should return paginated items", async () => {
      req.query = { page: "1", limit: "10" };
      const mockItems = [{ denomination: "Test" }];

      ItemModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockItems),
            }),
          }),
        }),
      });
      ItemModel.countDocuments.mockResolvedValue(1);

      await readItem(req, res);
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

      ItemModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      ItemModel.countDocuments.mockResolvedValue(0);

      await readItem(req, res);
      expect(ItemModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          denomination: { $regex: "piece", $options: "i" },
        }),
      );
    });

    it("should filter by low stock", async () => {
      req.query = { lowStock: "true", page: "1", limit: "10" };

      ItemModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      ItemModel.countDocuments.mockResolvedValue(0);

      await readItem(req, res);
      expect(ItemModel.find).toHaveBeenCalledWith(
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
      ItemModel.create.mockResolvedValue(mockCreated);

      await createItem(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item: mockCreated });
    });

    it("should return 400 when creation fails", async () => {
      req.body = { denomination: "" };
      ItemModel.create.mockRejectedValue(new Error("denomination required"));

      await createItem(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── updateItem ────────────────────────────────────────
  describe("updateItem", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params.id = "bad-id";
      await updateItem(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when item does not exist", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      ItemModel.findById.mockResolvedValue(null);

      await updateItem(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update an item successfully", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      req.body = { denomination: "Updated", quantite: 15 };

      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        denomination: "Original",
        quantite: 10,
        save: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          denomination: "Updated",
          quantite: 15,
        }),
      };
      ItemModel.findById.mockResolvedValue(mockItem);

      await updateItem(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should prevent negative quantity", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      req.body = { quantite: -5 };

      const mockItem = {
        _id: "507f1f77bcf86cd799439011",
        quantite: 10,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      ItemModel.findById.mockResolvedValue(mockItem);

      await updateItem(req, res);
      expect(mockItem.quantite).toBe(0);
    });
  });

  // ─── deleteItem ────────────────────────────────────────
  describe("deleteItem", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params.id = "bad-id";
      await deleteItem(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete an item successfully", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      ItemModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await deleteItem(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Sucessfully deleted.",
      });
    });
  });
});
