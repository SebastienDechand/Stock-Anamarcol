import { describe, it, expect } from 'vitest';
import { itemsReducer } from './items.reducer';
import { ItemsActions } from '../actions/items.actions';
import { initialItemsState } from '../state/items.state';
import type { Item } from '../../../../shared/models/item/item.model';

const sampleItem: Item = {
  _id: '1',
  posterId: 'u1',
  name: 'Pièce A',
  quantity: 10,
  supplier: 'Alpha',
  status: 'Neuf',
};

describe('itemsReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = itemsReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialItemsState);
  });

  it('should handle loadAllItems', () => {
    const state = itemsReducer(initialItemsState, ItemsActions.loadAllItems());
    expect(state.isLoading).toBe(true);
  });

  it('should handle loadAllItemsSuccess', () => {
    const state = itemsReducer(
      { ...initialItemsState, isLoading: true },
      ItemsActions.loadAllItemsSuccess({ items: [sampleItem] }),
    );
    expect(state.allItems).toEqual([sampleItem]);
    expect(state.loaded).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should handle loadAllItemsFailure', () => {
    const state = itemsReducer(
      { ...initialItemsState, isLoading: true },
      ItemsActions.loadAllItemsFailure({ error: 'boom' }),
    );
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('boom');
  });

  it('should handle fetchItems', () => {
    const state = itemsReducer(initialItemsState, ItemsActions.fetchItems({ params: {} }));
    expect(state.isLoading).toBe(true);
  });

  it('should handle fetchItemsSuccess', () => {
    const state = itemsReducer(
      { ...initialItemsState, isLoading: true },
      ItemsActions.fetchItemsSuccess({
        items: [sampleItem],
        total: 50,
        page: 2,
        totalPages: 5,
        canDecrement: { '1': true },
      }),
    );
    expect(state.items).toEqual([sampleItem]);
    expect(state.total).toBe(50);
    expect(state.page).toBe(2);
    expect(state.totalPages).toBe(5);
    expect(state.canDecrement).toEqual({ '1': true });
    expect(state.isLoading).toBe(false);
    expect(state.pageLoaded).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle fetchItemsFailure', () => {
    const state = itemsReducer(
      { ...initialItemsState, isLoading: true },
      ItemsActions.fetchItemsFailure({ error: 'oops' }),
    );
    expect(state.isLoading).toBe(false);
    expect(state.pageLoaded).toBe(true);
    expect(state.error).toBe('oops');
  });

  it('should handle createItemSuccess by prepending to both items and allItems', () => {
    const existing: Item = { ...sampleItem, _id: '2' };
    const state = itemsReducer(
      { ...initialItemsState, items: [existing], allItems: [existing], total: 1 },
      ItemsActions.createItemSuccess({ item: sampleItem }),
    );
    expect(state.items).toEqual([sampleItem, existing]);
    expect(state.allItems).toEqual([sampleItem, existing]);
    expect(state.total).toBe(2);
  });

  it('should handle updateItemSuccess in both items and allItems', () => {
    const updated: Item = { ...sampleItem, name: 'Pièce A modifiée' };
    const state = itemsReducer(
      { ...initialItemsState, items: [sampleItem], allItems: [sampleItem] },
      ItemsActions.updateItemSuccess({ item: updated }),
    );
    expect(state.items).toEqual([updated]);
    expect(state.allItems).toEqual([updated]);
  });

  it('should handle deleteItemSuccess by removing from items, allItems and decrementing total', () => {
    const state = itemsReducer(
      { ...initialItemsState, items: [sampleItem], allItems: [sampleItem], total: 1 },
      ItemsActions.deleteItemSuccess({ id: '1' }),
    );
    expect(state.items).toEqual([]);
    expect(state.allItems).toEqual([]);
    expect(state.total).toBe(0);
  });

  it('should handle updateQuantitySuccess', () => {
    const state = itemsReducer(
      { ...initialItemsState, items: [sampleItem], allItems: [sampleItem] },
      ItemsActions.updateQuantitySuccess({ id: '1', quantity: 99 }),
    );
    expect(state.items[0].quantity).toBe(99);
    expect(state.allItems[0].quantity).toBe(99);
  });

  it('should handle setSelectedItemId', () => {
    const state = itemsReducer(initialItemsState, ItemsActions.setSelectedItemId({ id: '1' }));
    expect(state.selectedItemId).toBe('1');
  });

  it('should handle loadItemHistory by resetting history and setting isLoadingHistory', () => {
    const previousHistory = [
      {
        _id: 'h1',
        itemId: '1',
        action: 'create' as const,
        userName: 'admin',
        createdAt: '2024-01-01',
      },
    ];
    const state = itemsReducer(
      { ...initialItemsState, history: previousHistory },
      ItemsActions.loadItemHistory({ id: '1' }),
    );
    expect(state.history).toEqual([]);
    expect(state.isLoadingHistory).toBe(true);
  });

  it('should handle loadItemHistorySuccess', () => {
    const history = [
      {
        _id: 'h1',
        itemId: '1',
        action: 'create' as const,
        userName: 'admin',
        createdAt: '2024-01-01',
      },
    ];
    const state = itemsReducer(
      { ...initialItemsState, isLoadingHistory: true },
      ItemsActions.loadItemHistorySuccess({ history }),
    );
    expect(state.history).toEqual(history);
    expect(state.isLoadingHistory).toBe(false);
  });
});
