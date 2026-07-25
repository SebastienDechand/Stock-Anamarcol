import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError, Subject } from 'rxjs';
import { firstValueFrom, take, toArray } from 'rxjs';
import { Action } from '@ngrx/store';

import { ItemsEffects } from './items.effects';
import { ItemsActions } from '../actions/items.actions';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { Item, ItemHistory, NewItem } from '../../../../shared/models/item/item.model';

// #region Realistic test data

const mockItem: Item = {
  _id: 'item-001',
  posterId: 'user-001',
  name: 'Stylo bleu',
  quantity: 10,
  supplier: 'Bureau Vallée',
  status: 'Neuf',
  cgKit: false,
  tpvKit: false,
};
// #endregion

const mockItem2: Item = {
  _id: 'item-002',
  posterId: 'user-001',
  name: 'Crayon HB',
  quantity: 50,
  supplier: 'Leclerc',
  status: 'Usagé',
};

const mockNewItem: NewItem = {
  name: 'Ramette papier A4',
  supplier: 'Staples',
  quantity: 5,
  status: 'Neuf',
  posterId: 'user-001',
  modifierName: 'Alice',
};

const mockHistory: ItemHistory[] = [
  {
    _id: 'hist-001',
    itemId: 'item-001',
    action: 'quantity_change',
    field: 'quantity',
    oldValue: '10',
    newValue: '15',
    userName: 'Alice',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    _id: 'hist-002',
    itemId: 'item-001',
    action: 'update',
    field: 'status',
    oldValue: 'Neuf',
    newValue: 'Usagé',
    userName: 'Bob',
    createdAt: '2026-01-02T09:00:00.000Z',
  },
];

// #region Tests

describe('ItemsEffects', () => {
  let effects: ItemsEffects;
  let actions$: Subject<Action>;
  let api: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    postFormData: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    actions$ = new Subject<Action>();

    api = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      postFormData: vi.fn(),
    };

    toast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ItemsEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    effects = TestBed.inject(ItemsEffects);
  });

  // #region loadAllItems$

  describe('loadAllItems$', () => {
    it('should dispatch loadAllItemsSuccess when API returns paginated object', async () => {
      const paginatedResponse = {
        items: [mockItem, mockItem2],
        total: 2,
        page: 1,
        totalPages: 1,
        canDecrement: {},
      };
      api.get.mockReturnValue(of(paginatedResponse));

      const loadAllItemsPromise = firstValueFrom(effects.loadAllItems$);
      actions$.next(ItemsActions.loadAllItems());
      const result = await loadAllItemsPromise;

      expect(result).toEqual(ItemsActions.loadAllItemsSuccess({ items: [mockItem, mockItem2] }));
    });

    it('should dispatch loadAllItemsSuccess when API returns a plain array', async () => {
      api.get.mockReturnValue(of([mockItem]));

      const loadAllItemsPromise = firstValueFrom(effects.loadAllItems$);
      actions$.next(ItemsActions.loadAllItems());
      const result = await loadAllItemsPromise;

      expect(result).toEqual(ItemsActions.loadAllItemsSuccess({ items: [mockItem] }));
    });

    it('should dispatch loadAllItemsFailure on API error', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Network error')));

      const loadAllItemsPromise = firstValueFrom(effects.loadAllItems$);
      actions$.next(ItemsActions.loadAllItems());
      const result = await loadAllItemsPromise;

      expect(result).toEqual(ItemsActions.loadAllItemsFailure({ error: 'Network error' }));
    });

    it('should use fallback error message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => ({})));

      const loadAllItemsPromise = firstValueFrom(effects.loadAllItems$);
      actions$.next(ItemsActions.loadAllItems());
      const result = await loadAllItemsPromise;

      expect(result).toEqual(ItemsActions.loadAllItemsFailure({ error: 'Erreur' }));
    });
  });
  // #endregion

  // #region fetchItems$

  describe('fetchItems$', () => {
    it('should dispatch fetchItemsSuccess with paginated data', async () => {
      const paginatedResponse = {
        items: [mockItem],
        total: 1,
        page: 2,
        totalPages: 5,
        canDecrement: { 'item-001': true },
      };
      api.get.mockReturnValue(of(paginatedResponse));

      const fetchItemsPromise = firstValueFrom(effects.fetchItems$);
      actions$.next(
        ItemsActions.fetchItems({
          params: {
            page: 2,
            limit: 20,
            search: 'stylo',
            supplier: ['Bureau Vallée'],
            status: ['Neuf'],
          },
        }),
      );
      const result = await fetchItemsPromise;

      expect(result).toEqual(
        ItemsActions.fetchItemsSuccess({
          items: [mockItem],
          total: 1,
          page: 2,
          totalPages: 5,
          canDecrement: { 'item-001': true },
        }),
      );
    });

    it('should dispatch fetchItemsSuccess with cgKit and tpvKit flags', async () => {
      const paginatedResponse = {
        items: [mockItem],
        total: 1,
        page: 1,
        totalPages: 1,
        canDecrement: {},
      };
      api.get.mockReturnValue(of(paginatedResponse));

      const fetchItemsPromise = firstValueFrom(effects.fetchItems$);
      actions$.next(
        ItemsActions.fetchItems({
          params: { cgKit: true, tpvKit: true, sortBy: 'name', sortOrder: 'asc' },
        }),
      );
      const result = await fetchItemsPromise;

      expect(result).toEqual(
        ItemsActions.fetchItemsSuccess({
          items: [mockItem],
          total: 1,
          page: 1,
          totalPages: 1,
          canDecrement: {},
        }),
      );
    });

    it('should use default values when API response fields are missing', async () => {
      api.get.mockReturnValue(of({}));

      const fetchItemsPromise = firstValueFrom(effects.fetchItems$);
      actions$.next(ItemsActions.fetchItems({ params: {} }));
      const result = await fetchItemsPromise;

      expect(result).toEqual(
        ItemsActions.fetchItemsSuccess({
          items: [],
          total: 0,
          page: 1,
          totalPages: 0,
          canDecrement: {},
        }),
      );
    });

    it('should dispatch fetchItemsFailure on API error', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Timeout')));

      const fetchItemsPromise = firstValueFrom(effects.fetchItems$);
      actions$.next(ItemsActions.fetchItems({ params: { page: 1 } }));
      const result = await fetchItemsPromise;

      expect(result).toEqual(ItemsActions.fetchItemsFailure({ error: 'Timeout' }));
    });
  });
  // #endregion

  // #region createItem$

  describe('createItem$', () => {
    it('should dispatch createItemSuccess and show success toast', async () => {
      api.post.mockReturnValue(of({ item: mockItem }));

      const createItemPromise = firstValueFrom(effects.createItem$);
      actions$.next(ItemsActions.createItem({ data: mockNewItem }));
      const result = await createItemPromise;

      expect(result).toEqual(ItemsActions.createItemSuccess({ item: mockItem }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.ITEM_ADDED');
      expect(api.postFormData).not.toHaveBeenCalled();
    });

    it('should dispatch createItemFailure and show error toast on API error', async () => {
      api.post.mockReturnValue(throwError(() => new Error('Validation failed')));

      const createItemPromise = firstValueFrom(effects.createItem$);
      actions$.next(ItemsActions.createItem({ data: mockNewItem }));
      const result = await createItemPromise;

      expect(result).toEqual(ItemsActions.createItemFailure({ error: 'Validation failed' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.ITEM_ADD_ERROR');
    });

    it('should use fallback error message when create error has no message', async () => {
      api.post.mockReturnValue(throwError(() => null));

      const createItemPromise = firstValueFrom(effects.createItem$);
      actions$.next(ItemsActions.createItem({ data: mockNewItem }));
      const result = await createItemPromise;

      expect(result).toEqual(ItemsActions.createItemFailure({ error: 'Erreur' }));
    });
  });
  // #endregion

  // #region updateItem$

  describe('updateItem$', () => {
    it('should dispatch updateItemSuccess and show success toast', async () => {
      const updatedItem: Item = { ...mockItem, name: 'Stylo rouge' };
      api.put.mockReturnValue(of({ item: updatedItem }));

      const updateItemPromise = firstValueFrom(effects.updateItem$);
      actions$.next(ItemsActions.updateItem({ id: 'item-001', data: { name: 'Stylo rouge' } }));
      const result = await updateItemPromise;

      expect(result).toEqual(ItemsActions.updateItemSuccess({ item: updatedItem }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.ITEM_UPDATED');
    });

    it('should dispatch updateItemFailure and show error toast on API error', async () => {
      api.put.mockReturnValue(throwError(() => new Error('Not found')));

      const updateItemPromise = firstValueFrom(effects.updateItem$);
      actions$.next(ItemsActions.updateItem({ id: 'item-001', data: { name: 'Stylo rouge' } }));
      const result = await updateItemPromise;

      expect(result).toEqual(ItemsActions.updateItemFailure({ error: 'Not found' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.ITEM_UPDATE_ERROR');
    });
  });
  // #endregion

  // #region deleteItem$

  describe('deleteItem$', () => {
    it('should dispatch deleteItemSuccess and show success toast', async () => {
      api.delete.mockReturnValue(of(void 0));

      const deleteItemPromise = firstValueFrom(effects.deleteItem$);
      actions$.next(ItemsActions.deleteItem({ id: 'item-001' }));
      const result = await deleteItemPromise;

      expect(result).toEqual(ItemsActions.deleteItemSuccess({ id: 'item-001' }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.ITEM_DELETED');
    });

    it('should dispatch deleteItemFailure and show error toast on API error', async () => {
      api.delete.mockReturnValue(throwError(() => new Error('Forbidden')));

      const deleteItemPromise = firstValueFrom(effects.deleteItem$);
      actions$.next(ItemsActions.deleteItem({ id: 'item-001' }));
      const result = await deleteItemPromise;

      expect(result).toEqual(ItemsActions.deleteItemFailure({ error: 'Forbidden' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.ITEM_DELETE_ERROR');
    });

    it('should use fallback error message when delete error has no message', async () => {
      api.delete.mockReturnValue(throwError(() => ({})));

      const deleteItemPromise = firstValueFrom(effects.deleteItem$);
      actions$.next(ItemsActions.deleteItem({ id: 'item-001' }));
      const result = await deleteItemPromise;

      expect(result).toEqual(ItemsActions.deleteItemFailure({ error: 'Erreur' }));
    });
  });
  // #endregion

  // #region updateQuantity$

  describe('updateQuantity$', () => {
    it('should dispatch updateQuantitySuccess and show success toast', async () => {
      const updatedItem: Item = { ...mockItem, quantity: 15 };
      api.put.mockReturnValue(of({ item: updatedItem }));

      const updateQuantityPromise = firstValueFrom(effects.updateQuantity$);
      actions$.next(
        ItemsActions.updateQuantity({
          id: 'item-001',
          quantity: 15,
          modifierName: 'Alice',
          operation: 'add',
        }),
      );
      const result = await updateQuantityPromise;

      expect(result).toEqual(
        ItemsActions.updateQuantitySuccess({ id: 'item-001', quantity: 15 }),
      );
      expect(toast.success).toHaveBeenCalledWith('TOAST.ITEM_QTY_UPDATED');
    });

    it('should dispatch updateQuantityFailure on API error', async () => {
      api.put.mockReturnValue(throwError(() => new Error('Stock error')));

      const updateQuantityPromise = firstValueFrom(effects.updateQuantity$);
      actions$.next(
        ItemsActions.updateQuantity({
          id: 'item-001',
          quantity: 0,
          modifierName: 'Bob',
          operation: 'subtract',
        }),
      );
      const result = await updateQuantityPromise;

      expect(result).toEqual(ItemsActions.updateQuantityFailure({ error: 'Stock error' }));
    });

    it('should use fallback error message when updateQuantity error has no message', async () => {
      api.put.mockReturnValue(throwError(() => null));

      const updateQuantityPromise = firstValueFrom(effects.updateQuantity$);
      actions$.next(
        ItemsActions.updateQuantity({
          id: 'item-001',
          quantity: 5,
          modifierName: 'Alice',
          operation: 'add',
        }),
      );
      const result = await updateQuantityPromise;

      expect(result).toEqual(ItemsActions.updateQuantityFailure({ error: 'Erreur' }));
    });
  });
  // #endregion

  // #region uploadPicture$

  describe('uploadPicture$', () => {
    it('should dispatch uploadItemPictureSuccess and show success toast', async () => {
      const itemWithImage: Item = { ...mockItem, image: 'https://cdn.example.com/photo.jpg' };
      api.postFormData.mockReturnValue(of(itemWithImage));
      const formData = new FormData();

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(ItemsActions.uploadItemPicture({ id: 'item-001', formData }));
      const result = await uploadPicturePromise;

      expect(result).toEqual(ItemsActions.uploadItemPictureSuccess({ item: itemWithImage }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.ITEM_IMAGE_UPDATED');
    });

    it('should send the item id as "itemId" in the multipart body, matching the backend', async () => {
      const itemWithImage: Item = { ...mockItem, image: 'https://cdn.example.com/photo.jpg' };
      api.postFormData.mockReturnValue(of(itemWithImage));
      const formData = new FormData();

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(ItemsActions.uploadItemPicture({ id: 'item-001', formData }));
      await uploadPicturePromise;

      expect(api.postFormData).toHaveBeenCalledWith('api/item/upload', formData);
      expect(formData.get('itemId')).toBe('item-001');
    });

    it('should dispatch uploadItemPictureFailure and show error toast on API error', async () => {
      api.postFormData.mockReturnValue(throwError(() => new Error('Upload failed')));
      const formData = new FormData();

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(ItemsActions.uploadItemPicture({ id: 'item-001', formData }));
      const result = await uploadPicturePromise;

      expect(result).toEqual(ItemsActions.uploadItemPictureFailure({ error: 'Upload failed' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.ITEM_IMAGE_ERROR');
    });

    it('should use fallback error message when uploadPicture error has no message', async () => {
      api.postFormData.mockReturnValue(throwError(() => ({})));
      const formData = new FormData();

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(ItemsActions.uploadItemPicture({ id: 'item-001', formData }));
      const result = await uploadPicturePromise;

      expect(result).toEqual(ItemsActions.uploadItemPictureFailure({ error: 'Erreur' }));
    });
  });
  // #endregion

  // #region prepaBatch$

  describe('prepaBatch$', () => {
    it('should dispatch prepaBatchSuccess then refetch items for cgKit increment', async () => {
      api.post.mockReturnValue(of({ updated: 3, message: 'ok' }));
      const params = { page: 1, cgKit: true };

      const resultsPromise = firstValueFrom(effects.prepaBatch$.pipe(take(2), toArray()));
      actions$.next(
        ItemsActions.prepaBatch({ field: 'cgKit', operation: 'increment', count: 3, params }),
      );
      const results = await resultsPromise;

      expect(results).toEqual([
        ItemsActions.prepaBatchSuccess(),
        ItemsActions.fetchItems({ params }),
      ]);
      expect(toast.success).toHaveBeenCalledWith('ITEMS.PREPA_BATCH_CG_INCREMENTED', {
        count: 3,
      });
    });

    it('should dispatch prepaBatchSuccess then refetch items for non-cgKit decrement', async () => {
      api.post.mockReturnValue(of({ updated: 5, message: 'ok' }));
      const params = { page: 1, tpvKit: true };

      const resultsPromise = firstValueFrom(effects.prepaBatch$.pipe(take(2), toArray()));
      actions$.next(
        ItemsActions.prepaBatch({ field: 'tpvKit', operation: 'decrement', count: 5, params }),
      );
      const results = await resultsPromise;

      expect(results).toEqual([
        ItemsActions.prepaBatchSuccess(),
        ItemsActions.fetchItems({ params }),
      ]);
      expect(toast.success).toHaveBeenCalledWith('ITEMS.PREPA_BATCH_TPV_DECREMENTED', {
        count: 5,
      });
    });

    it('should dispatch only prepaBatchSuccess and show error toast on API error', async () => {
      api.post.mockReturnValue(throwError(() => new Error('Batch failed')));

      const prepaBatchPromise = firstValueFrom(effects.prepaBatch$);
      actions$.next(
        ItemsActions.prepaBatch({ field: 'cgKit', operation: 'increment', count: 2, params: {} }),
      );
      const result = await prepaBatchPromise;

      expect(result).toEqual(ItemsActions.prepaBatchSuccess());
      expect(toast.error).toHaveBeenCalledWith('TOAST.ITEM_BATCH_ERROR');
    });
  });
  // #endregion

  // #region loadHistory$

  describe('loadHistory$', () => {
    it('should dispatch loadItemHistorySuccess with history entries', async () => {
      api.get.mockReturnValue(of(mockHistory));

      const loadHistoryPromise = firstValueFrom(effects.loadHistory$);
      actions$.next(ItemsActions.loadItemHistory({ id: 'item-001' }));
      const result = await loadHistoryPromise;

      expect(result).toEqual(ItemsActions.loadItemHistorySuccess({ history: mockHistory }));
    });

    it('should dispatch loadItemHistorySuccess with empty array on API error', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Not found')));

      const loadHistoryPromise = firstValueFrom(effects.loadHistory$);
      actions$.next(ItemsActions.loadItemHistory({ id: 'item-001' }));
      const result = await loadHistoryPromise;

      expect(result).toEqual(ItemsActions.loadItemHistorySuccess({ history: [] }));
    });
  });
  // #endregion
});
// #endregion
