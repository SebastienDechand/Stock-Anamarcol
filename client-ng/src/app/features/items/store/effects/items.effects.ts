import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { Item, ItemHistory } from '../../../../shared/models/item/item.model';
import { ItemsActions } from '../actions/items.actions';

interface PaginatedItems {
  items: Item[];
  total: number;
  page: number;
  totalPages: number;
  canDecrement: Record<string, boolean>;
}

@Injectable()
export class ItemsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loadAllItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.loadAllItems),
      exhaustMap(() =>
        this.api.get<PaginatedItems | Item[]>('api/item/', { limit: '9999' }).pipe(
          map((response) => {
            const items = Array.isArray(response) ? response : (response.items ?? []);
            return ItemsActions.loadAllItemsSuccess({ items });
          }),
          catchError((error) =>
            of(ItemsActions.loadAllItemsFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  fetchItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.fetchItems),
      switchMap(({ params }) => {
        const queryParams: Record<string, string> = {};
        if (params.page) queryParams['page'] = String(params.page);
        if (params.limit) queryParams['limit'] = String(params.limit);
        if (params.search) queryParams['search'] = params.search;
        if (params.supplier?.length) queryParams['supplier'] = params.supplier.join(',');
        if (params.status?.length) queryParams['status'] = params.status.join(',');
        if (params.cgKit) queryParams['cgKit'] = 'true';
        if (params.tpvKit) queryParams['tpvKit'] = 'true';
        if (params.sortBy) queryParams['sortBy'] = params.sortBy;
        if (params.sortOrder) queryParams['sortOrder'] = params.sortOrder;

        return this.api.get<PaginatedItems>('api/item/', queryParams).pipe(
          map((response) =>
            ItemsActions.fetchItemsSuccess({
              items: response.items ?? [],
              total: response.total ?? 0,
              page: response.page ?? 1,
              totalPages: response.totalPages ?? 0,
              canDecrement: response.canDecrement ?? {},
            }),
          ),
          catchError((error) =>
            of(ItemsActions.fetchItemsFailure({ error: error?.message ?? 'Erreur' })),
          ),
        );
      }),
    ),
  );

  createItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.createItem),
      exhaustMap(({ data }) =>
        this.api.post<{ item: Item }>('api/item/', data).pipe(
          map((response) => {
            this.toast.success('TOAST.ITEM_ADDED');
            return ItemsActions.createItemSuccess({ item: response.item });
          }),
          catchError((error) => {
            this.toast.error('TOAST.ITEM_ADD_ERROR');
            return of(ItemsActions.createItemFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  updateItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.updateItem),
      exhaustMap(({ id, data }) =>
        this.api.put<{ item: Item }>(`api/item/${id}`, data).pipe(
          map((response) => {
            this.toast.success('TOAST.ITEM_UPDATED');
            return ItemsActions.updateItemSuccess({ item: response.item });
          }),
          catchError((error) => {
            this.toast.error('TOAST.ITEM_UPDATE_ERROR');
            return of(ItemsActions.updateItemFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  deleteItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.deleteItem),
      exhaustMap(({ id }) =>
        this.api.delete<void>(`api/item/${id}`).pipe(
          map(() => {
            this.toast.success('TOAST.ITEM_DELETED');
            return ItemsActions.deleteItemSuccess({ id });
          }),
          catchError((error) => {
            this.toast.error('TOAST.ITEM_DELETE_ERROR');
            return of(ItemsActions.deleteItemFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  updateQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.updateQuantity),
      exhaustMap(({ id, quantity, modifierName, operation }) =>
        this.api.put<{ item: Item }>(`api/item/${id}`, { quantity, modifierName, operation }).pipe(
          map((response) => {
            this.toast.success('TOAST.ITEM_QTY_UPDATED');
            return ItemsActions.updateQuantitySuccess({ id, quantity: response.item.quantity });
          }),
          catchError((error) =>
            of(ItemsActions.updateQuantityFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  uploadPicture$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.uploadItemPicture),
      exhaustMap(({ id, formData }) => {
        formData.append('itemId', id);
        return this.api.postFormData<Item>('api/item/upload', formData).pipe(
          map((item) => {
            this.toast.success('TOAST.ITEM_IMAGE_UPDATED');
            return ItemsActions.uploadItemPictureSuccess({ item });
          }),
          catchError((error) => {
            this.toast.error('TOAST.ITEM_IMAGE_ERROR');
            return of(ItemsActions.uploadItemPictureFailure({ error: error?.message ?? 'Erreur' }));
          }),
        );
      }),
    ),
  );

  preparationBatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.preparationBatch),
      exhaustMap(({ field, operation, count, params }) =>
        this.api
          .post<{ updated: number; message: string }>('api/item/preparation-batch', {
            preparation: field,
            operation,
            count,
          })
          .pipe(
            switchMap((response) => {
              const key =
                field === 'cgKit'
                  ? operation === 'increment'
                    ? 'ITEMS.PREPARATION_BATCH_CG_INCREMENTED'
                    : 'ITEMS.PREPARATION_BATCH_CG_DECREMENTED'
                  : operation === 'increment'
                    ? 'ITEMS.PREPARATION_BATCH_TPV_INCREMENTED'
                    : 'ITEMS.PREPARATION_BATCH_TPV_DECREMENTED';
              this.toast.success(key, { count: response.updated });
              return of(
                ItemsActions.preparationBatchSuccess(),
                ItemsActions.fetchItems({ params }),
              );
            }),
            catchError(() => {
              this.toast.error('TOAST.ITEM_BATCH_ERROR');
              return of(ItemsActions.preparationBatchSuccess());
            }),
          ),
      ),
    ),
  );

  loadHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.loadItemHistory),
      switchMap(({ id }) =>
        this.api.get<ItemHistory[]>(`api/item/history/${id}`).pipe(
          map((history) => ItemsActions.loadItemHistorySuccess({ history })),
          catchError(() => of(ItemsActions.loadItemHistorySuccess({ history: [] }))),
        ),
      ),
    ),
  );
}
