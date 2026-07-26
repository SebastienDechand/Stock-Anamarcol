import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ItemsState } from '../state/items.state';

export const selectItemsState = createFeatureSelector<ItemsState>('items');

export const selectAllItems = createSelector(selectItemsState, (state) => state.allItems);
export const selectPageItems = createSelector(selectItemsState, (state) => state.items);
export const selectTotal = createSelector(selectItemsState, (state) => state.total);
export const selectPage = createSelector(selectItemsState, (state) => state.page);
export const selectTotalPages = createSelector(selectItemsState, (state) => state.totalPages);
export const selectItemsLoading = createSelector(selectItemsState, (state) => state.isLoading);
export const selectItemsLoaded = createSelector(selectItemsState, (state) => state.loaded);
export const selectItemsPageLoaded = createSelector(selectItemsState, (state) => state.pageLoaded);
export const selectSelectedItemId = createSelector(
  selectItemsState,
  (state) => state.selectedItemId,
);
export const selectCanDecrement = createSelector(selectItemsState, (state) => state.canDecrement);
export const selectSelectedItem = createSelector(
  selectItemsState,
  (state) => state.items.find((item) => item._id === state.selectedItemId) ?? null,
);
export const selectHistory = createSelector(selectItemsState, (state) => state.history);
export const selectIsLoadingHistory = createSelector(
  selectItemsState,
  (state) => state.isLoadingHistory,
);
