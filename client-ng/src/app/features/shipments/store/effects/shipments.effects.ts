import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { Shipment } from '../../../../shared/models/shipment/shipment.model';
import { ShipmentsActions } from '../actions/shipments.actions';

@Injectable()
export class ShipmentsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  fetch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShipmentsActions.fetchShipments),
      switchMap(({ params }) => {
        const queryParams: Record<string, string> = {};
        if (params.page) queryParams['page'] = String(params.page);
        if (params.limit) queryParams['limit'] = String(params.limit);
        if (params.sent !== undefined) queryParams['sent'] = String(params.sent);
        return this.api.get<Shipment[]>('api/shipments', queryParams).pipe(
          map((shipments) =>
            ShipmentsActions.fetchShipmentsSuccess({ shipments: shipments ?? [] }),
          ),
          catchError((error) =>
            of(ShipmentsActions.fetchShipmentsFailure({ error: error?.message ?? 'Erreur' })),
          ),
        );
      }),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShipmentsActions.createShipment),
      exhaustMap(({ data, createdByName }) =>
        this.api.post<Shipment>('api/shipments', { ...data, createdByName }).pipe(
          map((shipment) => {
            this.toast.success('TOAST.SHIPMENT_CREATED');
            return ShipmentsActions.createShipmentSuccess({ shipment });
          }),
          catchError((error) => {
            this.toast.error('TOAST.SHIPMENT_CREATE_ERROR');
            return of(
              ShipmentsActions.createShipmentFailure({ error: error?.message ?? 'Erreur' }),
            );
          }),
        ),
      ),
    ),
  );

  markSent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShipmentsActions.markSent),
      exhaustMap(({ id, sentBy }) =>
        this.api.put<Shipment>(`api/shipments/${id}/sent`, { sentBy }).pipe(
          map((shipment) => {
            this.toast.success('TOAST.SHIPMENT_SENT');
            return ShipmentsActions.markSentSuccess({ shipment });
          }),
          catchError((error) => {
            this.toast.error('TOAST.SHIPMENT_ERROR');
            return of(ShipmentsActions.markSentFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShipmentsActions.deleteShipment),
      exhaustMap(({ id }) =>
        this.api.delete<void>(`api/shipments/${id}`).pipe(
          map(() => {
            this.toast.success('TOAST.SHIPMENT_DELETED');
            return ShipmentsActions.deleteShipmentSuccess({ id });
          }),
          catchError((error) => {
            this.toast.error('TOAST.SHIPMENT_DELETE_ERROR');
            return of(
              ShipmentsActions.deleteShipmentFailure({ error: error?.message ?? 'Erreur' }),
            );
          }),
        ),
      ),
    ),
  );
}
