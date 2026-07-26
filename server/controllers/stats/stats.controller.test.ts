import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { Request, Response } from 'express';

const mockItemModel: Record<string, Mock> = vi.hoisted(() => ({
  aggregate: vi.fn(),
  find: vi.fn(),
  countDocuments: vi.fn(),
  distinct: vi.fn(),
}));

vi.mock('../../models/item.model', () => ({
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
  getSuppliersList,
  getStatisticsForSupplier,
  getStatusesList,
  getStatisticsForStatus,
} from './stats.controller';

describe('Stats Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis() as unknown as Response['status'],
      json: vi.fn() as unknown as Response['json'],
    };
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Always start with a fresh cache
    invalidateStatsCache();
  });

  afterEach(() => vi.restoreAllMocks());

  // #region Helper to set up aggregate / find mocks for getDashboardStats
  function setupDashboardMocks(overrides?: {
    globalStats?: Record<string, unknown>[];
    suppliersStats?: Record<string, unknown>[];
    statusesStats?: Record<string, unknown>[];
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
        suppliers: ['SupplierA', 'SupplierB'],
      },
    ];
    const suppliersStats = overrides?.suppliersStats ?? [];
    const statusesStats = overrides?.statusesStats ?? [];
    const lowStockItems = overrides?.lowStockItems ?? [];
    const cgItems = overrides?.cgItems ?? [];
    const tpvItems = overrides?.tpvItems ?? [];

    // aggregate is called 3 times (global, suppliers, statuses)
    mockItemModel.aggregate
      .mockResolvedValueOnce(globalStats)
      .mockResolvedValueOnce(suppliersStats)
      .mockResolvedValueOnce(statusesStats);

    // find is called 3 times (lowStock, cg, tpv)
    const chainLean = (data: unknown) => ({
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(data) }),
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(data) }),
    });
    mockItemModel.find
      .mockReturnValueOnce(chainLean(lowStockItems))
      .mockReturnValueOnce(chainLean(cgItems))
      .mockReturnValueOnce(chainLean(tpvItems));
  }
  // #endregion

  // #region getDashboardStats
  describe('getDashboardStats', () => {
    it('should return full dashboard data', async () => {
      setupDashboardMocks();
      await getDashboardStats(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = (res.json as Mock).mock.calls[0][0];
      expect(payload.global.numberOfArticles).toBe(10);
      expect(payload.global.totalStock).toBe(150);
      expect(payload.global.numberOfSuppliers).toBe(2);
      expect(payload.global.numberOfLowStockArticles).toBe(2);
    });

    it('should handle empty DB gracefully', async () => {
      setupDashboardMocks({ globalStats: [], cgItems: [], tpvItems: [] });
      await getDashboardStats(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = (res.json as Mock).mock.calls[0][0];
      expect(payload.global.numberOfArticles).toBe(0);
      expect(payload.global.cgKit).toBe(0);
      expect(payload.global.tpvKit).toBe(0);
    });

    it('should compute CG with cassette /4 logic', async () => {
      setupDashboardMocks({
        cgItems: [
          { name: 'Cassette Hooper', quantity: 9 },
          { name: 'Joint', quantity: 5 },
        ],
      });
      await getDashboardStats(req as Request, res as Response);
      const payload = (res.json as Mock).mock.calls[0][0];
      // Cassette: floor(9/4)=2, Joint: 5  → min = 2
      expect(payload.global.cgKit).toBe(2);
    });

    it('should compute TPV as min of quantities', async () => {
      setupDashboardMocks({
        tpvItems: [{ quantity: 8 }, { quantity: 3 }, { quantity: 12 }],
      });
      await getDashboardStats(req as Request, res as Response);
      const payload = (res.json as Mock).mock.calls[0][0];
      expect(payload.global.tpvKit).toBe(3);
    });

    it('should serve from cache on second call within TTL', async () => {
      setupDashboardMocks();
      await getDashboardStats(req as Request, res as Response);
      expect(mockItemModel.aggregate).toHaveBeenCalledTimes(3);

      // Second call - should not hit DB
      vi.clearAllMocks();
      await getDashboardStats(req as Request, res as Response);
      expect(mockItemModel.aggregate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should refresh after invalidateStatsCache', async () => {
      setupDashboardMocks();
      await getDashboardStats(req as Request, res as Response);
      invalidateStatsCache();

      // Reset res.json to capture only the second call's payload
      (res.json as Mock).mockClear();

      setupDashboardMocks({
        globalStats: [
          {
            _id: null,
            numberOfArticles: 20,
            totalStock: 300,
            numberOfLowStockArticles: 5,
            suppliers: ['X'],
          },
        ],
      });
      await getDashboardStats(req as Request, res as Response);
      const payload = (res.json as Mock).mock.calls[0][0];
      expect(payload.global.numberOfArticles).toBe(20);
    });

    it('should map suppliers and statuses stats', async () => {
      setupDashboardMocks({
        suppliersStats: [
          {
            _id: 'Alpha',
            numberOfArticles: 5,
            totalStock: 50,
            numberOfLowStockArticles: 1,
          },
        ],
        statusesStats: [
          {
            _id: 'Neuf',
            numberOfArticles: 3,
            totalStock: 30,
            numberOfLowStockArticles: 0,
          },
        ],
      });
      await getDashboardStats(req as Request, res as Response);
      const payload = (res.json as Mock).mock.calls[0][0];
      expect(payload.suppliers).toEqual([
        {
          name: 'Alpha',
          numberOfArticles: 5,
          totalStock: 50,
          numberOfLowStockArticles: 1,
        },
      ]);
      expect(payload.statuses).toEqual([
        {
          name: 'Neuf',
          numberOfArticles: 3,
          totalStock: 30,
          numberOfLowStockArticles: 0,
        },
      ]);
    });

    it('should return 500 on aggregate error', async () => {
      // Mock find so it doesn't throw synchronously (which would orphan
      // the rejected aggregate promises and crash the worker).
      const chainLean = () => ({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
        select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      mockItemModel.find
        .mockReturnValueOnce(chainLean())
        .mockReturnValueOnce(chainLean())
        .mockReturnValueOnce(chainLean());

      mockItemModel.aggregate.mockRejectedValue(new Error('aggregate boom'));
      await getDashboardStats(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion

  // #region Legacy endpoints
  describe('getNumberOfArticles', () => {
    it('should return count', async () => {
      mockItemModel.countDocuments.mockResolvedValue(42);
      await getNumberOfArticles(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ numberOfArticles: 42 });
    });

    it('should return 500 on error', async () => {
      mockItemModel.countDocuments.mockRejectedValue(new Error('fail'));
      await getNumberOfArticles(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion

  describe('getTotalStock', () => {
    it('should return total stock', async () => {
      mockItemModel.aggregate.mockResolvedValue([{ totalStock: 999 }]);
      await getTotalStock(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ totalStock: 999 });
    });

    it('should default to 0 when no items', async () => {
      mockItemModel.aggregate.mockResolvedValue([]);
      await getTotalStock(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ totalStock: 0 });
    });

    it('should return 500 on error', async () => {
      mockItemModel.aggregate.mockRejectedValue(new Error('fail'));
      await getTotalStock(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getNumberOfSuppliers', () => {
    it('should return supplier count', async () => {
      mockItemModel.distinct.mockResolvedValue(['A', 'B', 'C']);
      await getNumberOfSuppliers(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ numberOfSuppliers: 3 });
    });

    it('should return 500 on error', async () => {
      mockItemModel.distinct.mockRejectedValue(new Error('fail'));
      await getNumberOfSuppliers(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getNumberOfArticlesWithStockBelow5', () => {
    it('should return low-stock count', async () => {
      mockItemModel.countDocuments.mockResolvedValue(7);
      await getNumberOfArticlesWithStockBelow5(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ numberOfLowStockArticles: 7 });
    });

    it('should return 500 on error', async () => {
      mockItemModel.countDocuments.mockRejectedValue(new Error('fail'));
      await getNumberOfArticlesWithStockBelow5(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getArticlesWithLowStock', () => {
    it('should return sorted low-stock items', async () => {
      const items = [{ _id: 'i1', name: 'Joint', quantity: 2 }];
      mockItemModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(items) }),
      });
      await getArticlesWithLowStock(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith(items);
    });

    it('should return 500 on error', async () => {
      mockItemModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockRejectedValue(new Error('fail')),
        }),
      });
      await getArticlesWithLowStock(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getSuppliersList', () => {
    it('should return list of suppliers', async () => {
      mockItemModel.distinct.mockResolvedValue(['Alpha', 'Beta']);
      await getSuppliersList(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({
        suppliersList: ['Alpha', 'Beta'],
      });
    });

    it('should return 500 on error', async () => {
      mockItemModel.distinct.mockRejectedValue(new Error('fail'));
      await getSuppliersList(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getStatisticsForSupplier', () => {
    it('should return stats for a specific supplier', async () => {
      req.params = { supplier: 'Alpha' };
      mockItemModel.countDocuments.mockResolvedValue(4);
      mockItemModel.aggregate.mockResolvedValue([{ totalStock: 60, numberOfLowStockArticles: 1 }]);
      await getStatisticsForSupplier(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        numberOfArticles: 4,
        totalStock: 60,
        numberOfLowStockArticles: 1,
      });
    });

    it('should default to 0 when no items for supplier', async () => {
      req.params = { supplier: 'Unknown' };
      mockItemModel.countDocuments.mockResolvedValue(0);
      mockItemModel.aggregate.mockResolvedValue([]);
      await getStatisticsForSupplier(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({
        numberOfArticles: 0,
        totalStock: 0,
        numberOfLowStockArticles: 0,
      });
    });

    it('should return 500 on error', async () => {
      req.params = { supplier: 'Alpha' };
      mockItemModel.countDocuments.mockRejectedValue(new Error('fail'));
      await getStatisticsForSupplier(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getStatusesList', () => {
    it('should return list of statuses', async () => {
      mockItemModel.distinct.mockResolvedValue(['Neuf', 'Reconditionné']);
      await getStatusesList(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({
        statusesList: ['Neuf', 'Reconditionné'],
      });
    });

    it('should return 500 on error', async () => {
      mockItemModel.distinct.mockRejectedValue(new Error('fail'));
      await getStatusesList(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getStatisticsForStatus', () => {
    it('should return stats for a specific status', async () => {
      req.params = { status: 'Neuf' };
      mockItemModel.countDocuments.mockResolvedValue(6);
      mockItemModel.aggregate.mockResolvedValue([{ totalStock: 80, numberOfLowStockArticles: 0 }]);
      await getStatisticsForStatus(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        numberOfArticles: 6,
        totalStock: 80,
        numberOfLowStockArticles: 0,
      });
    });

    it('should default to 0 when no items for status', async () => {
      req.params = { status: 'Unknown' };
      mockItemModel.countDocuments.mockResolvedValue(0);
      mockItemModel.aggregate.mockResolvedValue([]);
      await getStatisticsForStatus(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({
        numberOfArticles: 0,
        totalStock: 0,
        numberOfLowStockArticles: 0,
      });
    });

    it('should return 500 on error', async () => {
      req.params = { status: 'Neuf' };
      mockItemModel.countDocuments.mockRejectedValue(new Error('fail'));
      await getStatisticsForStatus(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
