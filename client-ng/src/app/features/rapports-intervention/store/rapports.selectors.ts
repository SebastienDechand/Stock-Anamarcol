import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RapportsState } from './rapports.state';

export const selectRapportsState = createFeatureSelector<RapportsState>('rapports');

export const selectAllRapports = createSelector(selectRapportsState, (state) => state.rapports);
export const selectSelectedRapport = createSelector(
  selectRapportsState,
  (state) => state.selectedRapport,
);
export const selectRapportsLoading = createSelector(
  selectRapportsState,
  (state) => state.isLoading,
);
export const selectRapportsLoaded = createSelector(selectRapportsState, (state) => state.loaded);
