import { describe, it, expect } from 'vitest';
import {
  selectDashboard,
  selectGlobalStats,
  selectSupplierStats,
  selectLowStockItems,
  selectStatisticsLoading,
} from './statistics.selectors';
import { initialStatisticsState } from '../state/statistics.state';
import type {
  DashboardStats,
  GlobalStatistics,
  SupplierStats,
  LowStockItem,
} from '../../../../shared/models/statistics/statistics.model';

const sampleGlobal: GlobalStatistics = {
  numberOfArticles: 120,
  totalStock: 850,
  numberOfSuppliers: 5,
  numberOfLowStockArticles: 3,
  cgKit: 10,
  tpvKit: 7,
};

const sampleSupplier: SupplierStats = {
  name: 'Fournisseur A',
  numberOfArticles: 40,
  totalStock: 300,
  numberOfLowStockArticles: 1,
};

const sampleLowStockItem: LowStockItem = {
  _id: 'item-low-1',
  name: 'Article critique',
  supplier: 'Fournisseur B',
  status: 'occasion',
  quantity: 1,
};

const sampleDashboard: DashboardStats = {
  global: sampleGlobal,
  suppliers: [sampleSupplier],
  lowStockItems: [sampleLowStockItem],
};

describe('Statistics Selectors', () => {
  describe('selectDashboard', () => {
    it('should return null from initial state', () => {
      const state = { statistics: initialStatisticsState };
      expect(selectDashboard(state)).toBeNull();
    });

    it('should return dashboard when set', () => {
      const state = { statistics: { ...initialStatisticsState, dashboard: sampleDashboard } };
      expect(selectDashboard(state)).toEqual(sampleDashboard);
    });
  });

  describe('selectGlobalStats', () => {
    it('should return null from initial state (no dashboard)', () => {
      const state = { statistics: initialStatisticsState };
      expect(selectGlobalStats(state)).toBeNull();
    });

    it('should return global stats when dashboard is set', () => {
      const state = { statistics: { ...initialStatisticsState, dashboard: sampleDashboard } };
      expect(selectGlobalStats(state)).toEqual(sampleGlobal);
    });
  });

  describe('selectSupplierStats', () => {
    it('should return empty array from initial state (no dashboard)', () => {
      const state = { statistics: initialStatisticsState };
      expect(selectSupplierStats(state)).toEqual([]);
    });

    it('should return supplier stats when dashboard is set', () => {
      const state = { statistics: { ...initialStatisticsState, dashboard: sampleDashboard } };
      expect(selectSupplierStats(state)).toEqual([sampleSupplier]);
    });
  });

  describe('selectLowStockItems', () => {
    it('should return empty array from initial state (no dashboard)', () => {
      const state = { statistics: initialStatisticsState };
      expect(selectLowStockItems(state)).toEqual([]);
    });

    it('should return low stock items when dashboard is set', () => {
      const state = { statistics: { ...initialStatisticsState, dashboard: sampleDashboard } };
      expect(selectLowStockItems(state)).toEqual([sampleLowStockItem]);
    });

    it('should return empty array when dashboard has no low stock items', () => {
      const dashboardNoLow: DashboardStats = { ...sampleDashboard, lowStockItems: [] };
      const state = { statistics: { ...initialStatisticsState, dashboard: dashboardNoLow } };
      expect(selectLowStockItems(state)).toEqual([]);
    });
  });

  describe('selectStatisticsLoading', () => {
    it('should return false from initial state', () => {
      const state = { statistics: initialStatisticsState };
      expect(selectStatisticsLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = { statistics: { ...initialStatisticsState, isLoading: true } };
      expect(selectStatisticsLoading(state)).toBe(true);
    });
  });
});
