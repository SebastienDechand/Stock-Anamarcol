import { describe, it, expect } from 'vitest';
import {
  selectAllItems,
  selectPageItems,
  selectTotal,
  selectPage,
  selectTotalPages,
  selectItemsLoading,
  selectItemsLoaded,
  selectItemsPageLoaded,
  selectSelectedItemId,
  selectCanDecrement,
  selectSelectedItem,
  selectHistory,
  selectIsLoadingHistory,
} from './items.selectors';
import { initialItemsState } from '../state/items.state';
import type { Item, ItemHistory } from '../../../../shared/models/item/item.model';

const sampleItem: Item = {
  _id: 'item-1',
  posterId: 'user-1',
  name: 'Écran tactile',
  quantity: 5,
  supplier: 'Fournisseur A',
  status: 'bon',
};

const sampleItem2: Item = {
  _id: 'item-2',
  posterId: 'user-2',
  name: 'Clavier',
  quantity: 2,
  supplier: 'Fournisseur B',
  status: 'neuf',
};

const sampleHistory: ItemHistory = {
  _id: 'hist-1',
  itemId: 'item-1',
  action: 'quantity_change',
  field: 'quantity',
  oldValue: '4',
  newValue: '5',
  userName: 'Admin',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('Items Selectors', () => {
  describe('selectAllItems', () => {
    it('should return empty array from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectAllItems(state)).toEqual([]);
    });

    it('should return all items when populated', () => {
      const state = { items: { ...initialItemsState, allItems: [sampleItem, sampleItem2] } };
      expect(selectAllItems(state)).toEqual([sampleItem, sampleItem2]);
    });
  });

  describe('selectPageItems', () => {
    it('should return empty array from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectPageItems(state)).toEqual([]);
    });

    it('should return page items when populated', () => {
      const state = { items: { ...initialItemsState, items: [sampleItem] } };
      expect(selectPageItems(state)).toEqual([sampleItem]);
    });
  });

  describe('selectTotal', () => {
    it('should return 0 from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectTotal(state)).toBe(0);
    });

    it('should return total when set', () => {
      const state = { items: { ...initialItemsState, total: 42 } };
      expect(selectTotal(state)).toBe(42);
    });
  });

  describe('selectPage', () => {
    it('should return 1 from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectPage(state)).toBe(1);
    });

    it('should return current page when set', () => {
      const state = { items: { ...initialItemsState, page: 3 } };
      expect(selectPage(state)).toBe(3);
    });
  });

  describe('selectTotalPages', () => {
    it('should return 0 from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectTotalPages(state)).toBe(0);
    });

    it('should return total pages when set', () => {
      const state = { items: { ...initialItemsState, totalPages: 5 } };
      expect(selectTotalPages(state)).toBe(5);
    });
  });

  describe('selectItemsLoading', () => {
    it('should return false from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectItemsLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = { items: { ...initialItemsState, isLoading: true } };
      expect(selectItemsLoading(state)).toBe(true);
    });
  });

  describe('selectItemsLoaded', () => {
    it('should return false from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectItemsLoaded(state)).toBe(false);
    });

    it('should return true when loaded', () => {
      const state = { items: { ...initialItemsState, loaded: true } };
      expect(selectItemsLoaded(state)).toBe(true);
    });
  });

  describe('selectItemsPageLoaded', () => {
    it('should return false from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectItemsPageLoaded(state)).toBe(false);
    });

    it('should return true once the paginated grid has resolved at least once', () => {
      const state = { items: { ...initialItemsState, pageLoaded: true } };
      expect(selectItemsPageLoaded(state)).toBe(true);
    });
  });

  describe('selectSelectedItemId', () => {
    it('should return null from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectSelectedItemId(state)).toBeNull();
    });

    it('should return the selected item id when set', () => {
      const state = { items: { ...initialItemsState, selectedItemId: 'item-1' } };
      expect(selectSelectedItemId(state)).toBe('item-1');
    });
  });

  describe('selectCanDecrement', () => {
    it('should return empty object from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectCanDecrement(state)).toEqual({});
    });

    it('should return canDecrement map when set', () => {
      const canDecrement = { 'item-1': true, 'item-2': false };
      const state = { items: { ...initialItemsState, canDecrement } };
      expect(selectCanDecrement(state)).toEqual(canDecrement);
    });
  });

  describe('selectSelectedItem', () => {
    it('should return null from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectSelectedItem(state)).toBeNull();
    });

    it('should return null when selectedItemId does not match any item', () => {
      const state = {
        items: { ...initialItemsState, items: [sampleItem], selectedItemId: 'item-999' },
      };
      expect(selectSelectedItem(state)).toBeNull();
    });

    it('should return the matching item when selectedItemId matches', () => {
      const state = {
        items: {
          ...initialItemsState,
          items: [sampleItem, sampleItem2],
          selectedItemId: 'item-2',
        },
      };
      expect(selectSelectedItem(state)).toEqual(sampleItem2);
    });
  });

  describe('selectHistory', () => {
    it('should return empty array from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectHistory(state)).toEqual([]);
    });

    it('should return history when populated', () => {
      const state = { items: { ...initialItemsState, history: [sampleHistory] } };
      expect(selectHistory(state)).toEqual([sampleHistory]);
    });
  });

  describe('selectIsLoadingHistory', () => {
    it('should return false from initial state', () => {
      const state = { items: initialItemsState };
      expect(selectIsLoadingHistory(state)).toBe(false);
    });

    it('should return true when loading history', () => {
      const state = { items: { ...initialItemsState, isLoadingHistory: true } };
      expect(selectIsLoadingHistory(state)).toBe(true);
    });
  });
});
