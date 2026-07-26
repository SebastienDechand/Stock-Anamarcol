import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HistoryState } from '../state/history.state';

export const selectHistoryState = createFeatureSelector<HistoryState>('history');

export const selectHistoryEvents = createSelector(selectHistoryState, (state) => state.events);
export const selectHistoryUsers = createSelector(selectHistoryState, (state) => state.users);
export const selectHistoryIsLoading = createSelector(
  selectHistoryState,
  (state) => state.isLoading,
);
export const selectHistoryIsPurging = createSelector(
  selectHistoryState,
  (state) => state.isPurging,
);
