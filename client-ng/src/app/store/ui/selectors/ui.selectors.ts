import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UiState } from '../state/ui.state';

export const selectUiState = createFeatureSelector<UiState>('ui');
export const selectSidebarOpen = createSelector(selectUiState, (state) => state.sidebarOpen);
