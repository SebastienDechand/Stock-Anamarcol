import { createReducer, on } from '@ngrx/store';
import { StatisticsActions } from '../actions/statistics.actions';
import { initialStatisticsState } from '../state/statistics.state';

export const statisticsReducer = createReducer(
  initialStatisticsState,
  on(StatisticsActions.loadDashboard, (state) => ({ ...state, isLoading: true, error: null })),
  on(StatisticsActions.loadDashboardSuccess, (state, { data }) => ({
    ...state,
    dashboard: data,
    isLoading: false,
  })),
  on(StatisticsActions.loadDashboardFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),
);
