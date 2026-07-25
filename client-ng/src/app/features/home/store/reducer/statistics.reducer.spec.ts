import { describe, it, expect } from 'vitest';
import { statisticsReducer } from './statistics.reducer';
import { StatisticsActions } from '../actions/statistics.actions';
import { initialStatisticsState } from '../state/statistics.state';
import type { DashboardStats } from '../../../../shared/models/statistics/statistics.model';

const sampleDashboard: DashboardStats = {
  global: {
    numberOfArticles: 120,
    totalStock: 3450,
    numberOfSuppliers: 8,
    numberOfLowStockArticles: 5,
    cgKit: 12,
    tpvKit: 7,
  },
  suppliers: [
    {
      numberOfArticles: 40,
      totalStock: 1200,
      numberOfLowStockArticles: 2,
      name: 'Alpha',
    },
    {
      numberOfArticles: 80,
      totalStock: 2250,
      numberOfLowStockArticles: 3,
      name: 'Beta',
    },
  ],
  lowStockItems: [
    {
      _id: 'i1',
      name: 'Écran tactile 15"',
      supplier: 'Alpha',
      status: 'Neuf',
      quantity: 1,
    },
    {
      _id: 'i2',
      name: 'Tiroir caisse USB',
      supplier: 'Beta',
      status: 'Reconditionné',
      quantity: 2,
    },
  ],
};

describe('statisticsReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = statisticsReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialStatisticsState);
  });

  it('should handle loadDashboard by setting isLoading to true and clearing error', () => {
    const stateWithError = { ...initialStatisticsState, error: 'previous error' };
    const state = statisticsReducer(stateWithError, StatisticsActions.loadDashboard());
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle loadDashboardSuccess', () => {
    const state = statisticsReducer(
      { ...initialStatisticsState, isLoading: true },
      StatisticsActions.loadDashboardSuccess({ data: sampleDashboard }),
    );
    expect(state.dashboard).toEqual(sampleDashboard);
    expect(state.isLoading).toBe(false);
  });

  it('should handle loadDashboardSuccess with correct global stats', () => {
    const state = statisticsReducer(
      { ...initialStatisticsState, isLoading: true },
      StatisticsActions.loadDashboardSuccess({ data: sampleDashboard }),
    );
    expect(state.dashboard?.global.numberOfArticles).toBe(120);
    expect(state.dashboard?.global.numberOfLowStockArticles).toBe(5);
    expect(state.dashboard?.suppliers).toHaveLength(2);
    expect(state.dashboard?.lowStockItems).toHaveLength(2);
  });

  it('should handle loadDashboardFailure', () => {
    const state = statisticsReducer(
      { ...initialStatisticsState, isLoading: true },
      StatisticsActions.loadDashboardFailure({ error: 'Timeout serveur' }),
    );
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Timeout serveur');
  });

  it('should not modify dashboard on loadDashboardFailure', () => {
    const state = statisticsReducer(
      { ...initialStatisticsState, isLoading: true, dashboard: sampleDashboard },
      StatisticsActions.loadDashboardFailure({ error: 'Erreur' }),
    );
    expect(state.dashboard).toEqual(sampleDashboard);
  });
});
