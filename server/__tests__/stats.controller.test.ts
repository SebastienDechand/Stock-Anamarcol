import { Request, Response } from "express";

const mockItemModel: Record<string, jest.Mock> = {
  aggregate: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  distinct: jest.fn(),
};

jest.mock("../models/item.model", () => ({
  __esModule: true,
  default: mockItemModel,
}));

import {
  getDashboardStats,
  invalidateStatsCache,
  getNumberOfArticles,
  getTotalStock,
  getNumberOfSuppliers,
  getNumberOfArticlesWithStockBelow5,
  getArticlesWithLowStock,
  getFournisseursList,
  getStatisticsForFournisseur,
  getEtatsList,
  getStatisticsForEtat,
} from "../controllers/stats.controller";

describe("Stats Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn() as unknown as Response["json"],
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Always start with a fresh cache
    invalidateStatsCache();
  });

  afterEach(() => jest.restoreAllMocks());

  // ── Helper to set up aggregate / find mocks for getDashboardStats ──
  function setupDashboardMocks(overrides?: {
    globalStats?: Record<string, unknown>[];
    fournisseursStats?: Record<string, unknown>[];
    etatsStats?: Record<string, unknown>[];
    lowStockItems?: unknown[];
    cgItems?: unknown[];
    tpvItems?: unknown[];
  }) {
    const globalStats = overrides?.globalStats ?? [
      {
        _id: null,
        numberOfArticles: 10,
        totalStock: 150,
        numberOfLowStockArticles: 2,
        fournisseurs: ["FournisseurA", "FournisseurB"],
      },
    ];
    const fournisseursStats = overrides?.fournisseursStats ?? [];
    const etatsStats = overrides?.etatsStats ?? [];
    const lowStockItems = overrides?.lowStockItems ?? [];
    const cgItems = overrides?.cgItems ?? [];
    const tpvItems = overrides?.tpvItems ?? [];

    // aggregate is called 3 times (global, fournisseurs, etats)
    mockItemModel.aggregate
      .mockResolvedValueOnce(globalStats)
      .mockResolvedValueOnce(fournisseursStats)
      .mockResolvedValueOnce(etatsStats);

    // find is called 3 times (lowStock, cg, tpv)
    const chainLean = (data: unknown) => ({
      sort: jest
        .fn()
        .mockReturnValue({ lean: jest.fn().mockResolvedValue(data) }),
      select: jest
        .fn()
        .mockReturnValue({ lean: jest.fn().mockResolvedValue(data) }),
    });
    mockItemModel.find
      .mockReturnValueOnce(chainLean(lowStockItems))
      .mockReturnValueOnce(chainLean(cgItems))
      .mockReturnValueOnce(chainLean(tpvItems));
  }

  // ── getDashboardStats ──
  describe("getDashboardStats", () => {
    it("should return full dashboard data", async () => {
      setupDashboardMocks();
      await getDashboardStats(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.global.numberOfArticles).toBe(10);
      expect(payload.global.totalStock).toBe(150);
      expect(payload.global.numberOfSuppliers).toBe(2);
      expect(payload.global.numberOfLowStockArticles).toBe(2);
    });

    it("should handle empty DB gracefully", async () => {
      setupDashboardMocks({ globalStats: [], cgItems: [], tpvItems: [] });
      await getDashboardStats(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.global.numberOfArticles).toBe(0);
      expect(payload.global.prepaCG).toBe(0);
      expect(payload.global.prepaTPV).toBe(0);
    });

    it("should compute CG with cassette /4 logic", async () => {
      setupDashboardMocks({
        cgItems: [
          { denomination: "Cassette Hooper", quantite: 9 },
          { denomination: "Joint", quantite: 5 },
        ],
      });
      await getDashboardStats(req as Request, res as Response);
      const payload = (res.json as jest.Mock).mock.calls[0][0];
      // Cassette: floor(9/4)=2, Joint: 5  → min = 2
      expect(payload.global.prepaCG).toBe(2);
    });

    it("should compute TPV as min of quantities", async () => {
      setupDashboardMocks({
        tpvItems: [{ quantite: 8 }, { quantite: 3 }, { quantite: 12 }],
      });
      await getDashboardStats(req as Request, res as Response);
      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.global.prepaTPV).toBe(3);
    });

    it("should serve from cache on second call within TTL", async () => {
      setupDashboardMocks();
      await getDashboardStats(req as Request, res as Response);
      expect(mockItemModel.aggregate).toHaveBeenCalledTimes(3);

      // Second call — should not hit DB
      jest.clearAllMocks();
      await getDashboardStats(req as Request, res as Response);
      expect(mockItemModel.aggregate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should refresh after invalidateStatsCache", async () => {
      setupDashboardMocks();
      await getDashboardStats(req as Request, res as Response);
      invalidateStatsCache();

      // Reset res.json to capture only the second call's payload
      (res.json as jest.Mock).mockClear();

      setupDashboardMocks({
        globalStats: [
          {
            _id: null,
            numberOfArticles: 20,
            totalStock: 300,
            numberOfLowStockArticles: 5,
            fournisseurs: ["X"],
          },
        ],
      });
      await getDashboardStats(req as Request, res as Response);
      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.global.numberOfArticles).toBe(20);
    });

    it("should map fournisseurs and etats stats", async () => {
      setupDashboardMocks({
        fournisseursStats: [
          {
            _id: "Alpha",
            numberOfArticles: 5,
            totalStock: 50,
            numberOfLowStockArticles: 1,
          },
        ],
        etatsStats: [
          {
            _id: "Neuf",
            numberOfArticles: 3,
            totalStock: 30,
            numberOfLowStockArticles: 0,
          },
        ],
      });
      await getDashboardStats(req as Request, res as Response);
      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.fournisseurs).toEqual([
        {
          nom: "Alpha",
          numberOfArticles: 5,
          totalStock: 50,
          numberOfLowStockArticles: 1,
        },
      ]);
      expect(payload.etats).toEqual([
        {
          nom: "Neuf",
          numberOfArticles: 3,
          totalStock: 30,
          numberOfLowStockArticles: 0,
        },
      ]);
    });

    it("should return 500 on aggregate error", async () => {
      // Mock find so it doesn't throw synchronously (which would orphan
      // the rejected aggregate promises and crash the worker).
      const chainLean = () => ({
        sort: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      });
      mockItemModel.find
        .mockReturnValueOnce(chainLean())
        .mockReturnValueOnce(chainLean())
        .mockReturnValueOnce(chainLean());

      mockItemModel.aggregate.mockRejectedValue(new Error("aggregate boom"));
      await getDashboardStats(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── Legacy endpoints ──
  describe("getNumberOfArticles", () => {
    it("should return count", async () => {
      mockItemModel.countDocuments.mockResolvedValue(42);
      await getNumberOfArticles(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ numberOfArticles: 42 });
    });

    it("should return 500 on error", async () => {
      mockItemModel.countDocuments.mockRejectedValue(new Error("fail"));
      await getNumberOfArticles(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getTotalStock", () => {
    it("should return total stock", async () => {
      mockItemModel.aggregate.mockResolvedValue([{ totalStock: 999 }]);
      await getTotalStock(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ totalStock: 999 });
    });

    it("should default to 0 when no items", async () => {
      mockItemModel.aggregate.mockResolvedValue([]);
      await getTotalStock(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ totalStock: 0 });
    });

    it("should return 500 on error", async () => {
      mockItemModel.aggregate.mockRejectedValue(new Error("fail"));
      await getTotalStock(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getNumberOfSuppliers", () => {
    it("should return supplier count", async () => {
      mockItemModel.distinct.mockResolvedValue(["A", "B", "C"]);
      await getNumberOfSuppliers(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ numberOfSuppliers: 3 });
    });

    it("should return 500 on error", async () => {
      mockItemModel.distinct.mockRejectedValue(new Error("fail"));
      await getNumberOfSuppliers(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getNumberOfArticlesWithStockBelow5", () => {
    it("should return low-stock count", async () => {
      mockItemModel.countDocuments.mockResolvedValue(7);
      await getNumberOfArticlesWithStockBelow5(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ numberOfLowStockArticles: 7 });
    });

    it("should return 500 on error", async () => {
      mockItemModel.countDocuments.mockRejectedValue(new Error("fail"));
      await getNumberOfArticlesWithStockBelow5(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getArticlesWithLowStock", () => {
    it("should return sorted low-stock items", async () => {
      const items = [{ _id: "i1", denomination: "Joint", quantite: 2 }];
      mockItemModel.find.mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(items) }),
      });
      await getArticlesWithLowStock(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith(items);
    });

    it("should return 500 on error", async () => {
      mockItemModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error("fail")),
        }),
      });
      await getArticlesWithLowStock(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getFournisseursList", () => {
    it("should return list of fournisseurs", async () => {
      mockItemModel.distinct.mockResolvedValue(["Alpha", "Beta"]);
      await getFournisseursList(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({
        fournisseursList: ["Alpha", "Beta"],
      });
    });

    it("should return 500 on error", async () => {
      mockItemModel.distinct.mockRejectedValue(new Error("fail"));
      await getFournisseursList(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getStatisticsForFournisseur", () => {
    it("should return stats for a specific fournisseur", async () => {
      req.params = { fournisseur: "Alpha" };
      mockItemModel.countDocuments.mockResolvedValue(4);
      mockItemModel.aggregate.mockResolvedValue([
        { totalStock: 60, numberOfLowStockArticles: 1 },
      ]);
      await getStatisticsForFournisseur(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        numberOfArticles: 4,
        totalStock: 60,
        numberOfLowStockArticles: 1,
      });
    });

    it("should default to 0 when no items for fournisseur", async () => {
      req.params = { fournisseur: "Unknown" };
      mockItemModel.countDocuments.mockResolvedValue(0);
      mockItemModel.aggregate.mockResolvedValue([]);
      await getStatisticsForFournisseur(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({
        numberOfArticles: 0,
        totalStock: 0,
        numberOfLowStockArticles: 0,
      });
    });

    it("should return 500 on error", async () => {
      req.params = { fournisseur: "Alpha" };
      mockItemModel.countDocuments.mockRejectedValue(new Error("fail"));
      await getStatisticsForFournisseur(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getEtatsList", () => {
    it("should return list of etats", async () => {
      mockItemModel.distinct.mockResolvedValue(["Neuf", "Reconditionné"]);
      await getEtatsList(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({
        etatsList: ["Neuf", "Reconditionné"],
      });
    });

    it("should return 500 on error", async () => {
      mockItemModel.distinct.mockRejectedValue(new Error("fail"));
      await getEtatsList(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getStatisticsForEtat", () => {
    it("should return stats for a specific etat", async () => {
      req.params = { etat: "Neuf" };
      mockItemModel.countDocuments.mockResolvedValue(6);
      mockItemModel.aggregate.mockResolvedValue([
        { totalStock: 80, numberOfLowStockArticles: 0 },
      ]);
      await getStatisticsForEtat(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        numberOfArticles: 6,
        totalStock: 80,
        numberOfLowStockArticles: 0,
      });
    });

    it("should default to 0 when no items for etat", async () => {
      req.params = { etat: "Unknown" };
      mockItemModel.countDocuments.mockResolvedValue(0);
      mockItemModel.aggregate.mockResolvedValue([]);
      await getStatisticsForEtat(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({
        numberOfArticles: 0,
        totalStock: 0,
        numberOfLowStockArticles: 0,
      });
    });

    it("should return 500 on error", async () => {
      req.params = { etat: "Neuf" };
      mockItemModel.countDocuments.mockRejectedValue(new Error("fail"));
      await getStatisticsForEtat(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
