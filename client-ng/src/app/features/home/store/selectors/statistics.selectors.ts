import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StatisticsState } from '../state/statistics.state';

export const selectStatisticsState = createFeatureSelector<StatisticsState>('statistics');

export const selectDashboard = createSelector(selectStatisticsState, (state) => state.dashboard);
export const selectGlobalStats = createSelector(
  selectStatisticsState,
  (state) => state.dashboard?.global ?? null,
);
export const selectSupplierStats = createSelector(
  selectStatisticsState,
  (state) => state.dashboard?.suppliers ?? [],
);
export const selectLowStockItems = createSelector(
  selectStatisticsState,
  (state) => state.dashboard?.lowStockItems ?? [],
);
export const selectStatisticsLoading = createSelector(
  selectStatisticsState,
  (state) => state.isLoading,
);
