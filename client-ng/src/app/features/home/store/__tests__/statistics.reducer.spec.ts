import { describe, it, expect } from 'vitest';
import { statisticsReducer } from '../statistics.reducer';
import { StatisticsActions } from '../statistics.actions';
import { initialStatisticsState } from '../statistics.state';
import type { DashboardStats } from '../../../../shared/models/statistics.model';

const sampleDashboard: DashboardStats = {
  global: {
    numberOfArticles: 120,
    totalStock: 3450,
    numberOfSuppliers: 8,
    numberOfLowStockArticles: 5,
    prepaCG: 12,
    prepaTPV: 7,
  },
  fournisseurs: [
    {
      numberOfArticles: 40,
      totalStock: 1200,
      numberOfLowStockArticles: 2,
      nom: 'Alpha',
    },
    {
      numberOfArticles: 80,
      totalStock: 2250,
      numberOfLowStockArticles: 3,
      nom: 'Beta',
    },
  ],
  lowStockItems: [
    {
      _id: 'i1',
      denomination: 'Écran tactile 15"',
      fournisseur: 'Alpha',
      etat: 'Neuf',
      quantite: 1,
    },
    {
      _id: 'i2',
      denomination: 'Tiroir caisse USB',
      fournisseur: 'Beta',
      etat: 'Reconditionné',
      quantite: 2,
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
    expect(state.dashboard?.fournisseurs).toHaveLength(2);
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
