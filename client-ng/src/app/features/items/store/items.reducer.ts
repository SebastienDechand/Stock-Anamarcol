import { createReducer, on } from '@ngrx/store';
import { ItemsActions } from './items.actions';
import { initialItemsState } from './items.state';

export const itemsReducer = createReducer(
  initialItemsState,

  on(ItemsActions.loadAllItems, (state) => ({ ...state, isLoading: true })),
  on(ItemsActions.loadAllItemsSuccess, (state, { items }) => ({
    ...state,
    allItems: items,
    loaded: true,
    isLoading: false,
  })),
  on(ItemsActions.loadAllItemsFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(ItemsActions.fetchItems, (state) => ({ ...state, isLoading: true })),
  on(ItemsActions.fetchItemsSuccess, (state, { items, total, page, totalPages, canDecrement }) => ({
    ...state,
    items,
    total,
    page,
    totalPages,
    canDecrement,
    isLoading: false,
    error: null,
  })),
  on(ItemsActions.fetchItemsFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(ItemsActions.createItemSuccess, (state, { item }) => ({
    ...state,
    allItems: [item, ...state.allItems],
  })),

  on(ItemsActions.updateItemSuccess, (state, { item }) => ({
    ...state,
    items: state.items.map((existing) => (existing._id === item._id ? item : existing)),
    allItems: state.allItems.map((existing) => (existing._id === item._id ? item : existing)),
  })),

  on(ItemsActions.deleteItemSuccess, (state, { id }) => ({
    ...state,
    items: state.items.filter((existing) => existing._id !== id),
    allItems: state.allItems.filter((existing) => existing._id !== id),
    total: state.total - 1,
  })),

  on(ItemsActions.updateQuantitySuccess, (state, { id, quantity }) => ({
    ...state,
    items: state.items.map((existing) =>
      existing._id === id ? { ...existing, quantity } : existing,
    ),
    allItems: state.allItems.map((existing) =>
      existing._id === id ? { ...existing, quantity } : existing,
    ),
  })),

  on(ItemsActions.uploadItemPictureSuccess, (state, { item }) => ({
    ...state,
    items: state.items.map((existing) => (existing._id === item._id ? item : existing)),
    allItems: state.allItems.map((existing) => (existing._id === item._id ? item : existing)),
  })),
  on(ItemsActions.uploadItemPictureFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(ItemsActions.setSelectedItemId, (state, { id }) => ({
    ...state,
    selectedItemId: id,
  })),

  on(ItemsActions.loadItemHistory, (state) => ({ ...state, isLoadingHistory: true, history: [] })),
  on(ItemsActions.loadItemHistorySuccess, (state, { history }) => ({
    ...state,
    history,
    isLoadingHistory: false,
  })),
);
