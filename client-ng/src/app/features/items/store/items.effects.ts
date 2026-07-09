import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/toast/toast.service';
import { Item, ItemHistory } from '../../../shared/models/item.model';
import { ItemsActions } from './items.actions';

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
        if (params.fournisseur?.length) queryParams['fournisseur'] = params.fournisseur.join(',');
        if (params.etat?.length) queryParams['etat'] = params.etat.join(',');
        if (params.prepaCG) queryParams['prepaCG'] = 'true';
        if (params.prepaTPV) queryParams['prepaTPV'] = 'true';
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

  updateQuantite$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.updateQuantite),
      exhaustMap(({ id, quantite, modifierName, operation }) =>
        this.api.put<{ item: Item }>(`api/item/${id}`, { quantite, modifierName, operation }).pipe(
          map((response) => {
            this.toast.success('TOAST.ITEM_QTY_UPDATED');
            return ItemsActions.updateQuantiteSuccess({ id, quantite: response.item.quantite });
          }),
          catchError((error) =>
            of(ItemsActions.updateQuantiteFailure({ error: error?.message ?? 'Erreur' })),
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

  prepaBatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.prepaBatch),
      exhaustMap(({ field, operation, count, params }) =>
        this.api
          .post<{ updated: number; message: string }>('api/item/prepa-batch', {
            prepa: field,
            operation,
            count,
          })
          .pipe(
            switchMap((response) => {
              const key =
                field === 'prepaCG'
                  ? operation === 'increment'
                    ? 'ITEMS.PREPA_BATCH_CG_INCREMENTED'
                    : 'ITEMS.PREPA_BATCH_CG_DECREMENTED'
                  : operation === 'increment'
                    ? 'ITEMS.PREPA_BATCH_TPV_INCREMENTED'
                    : 'ITEMS.PREPA_BATCH_TPV_DECREMENTED';
              this.toast.success(key, { count: response.updated });
              return of(ItemsActions.prepaBatchSuccess(), ItemsActions.fetchItems({ params }));
            }),
            catchError(() => {
              this.toast.error('TOAST.ITEM_BATCH_ERROR');
              return of(ItemsActions.prepaBatchSuccess());
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
