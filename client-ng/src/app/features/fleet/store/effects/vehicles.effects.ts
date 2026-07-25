import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { Vehicle } from '../../../../shared/models/vehicle/vehicle.model';
import { VehiclesActions } from '../actions/vehicles.actions';

function clean(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]),
  );
}

@Injectable()
export class VehiclesEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loadAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VehiclesActions.loadAll),
      exhaustMap(() =>
        this.api.get<Vehicle[]>('api/vehicles').pipe(
          map((vehicles) => VehiclesActions.loadAllSuccess({ vehicles })),
          catchError((err) =>
            of(VehiclesActions.loadAllFailure({ error: err?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  loadOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VehiclesActions.loadOne),
      switchMap(({ id }) =>
        this.api.get<Vehicle>(`api/vehicles/${id}`).pipe(
          map((vehicle) => VehiclesActions.loadOneSuccess({ vehicle })),
          catchError(() => of(VehiclesActions.loadAllFailure({ error: 'Erreur chargement' }))),
        ),
      ),
    ),
  );

  search$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VehiclesActions.search),
      switchMap(({ q }) =>
        this.api.get<Vehicle[]>('api/vehicles/search', { q }).pipe(
          map((vehicles) => VehiclesActions.searchSuccess({ vehicles })),
          catchError(() => of(VehiclesActions.searchSuccess({ vehicles: [] }))),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VehiclesActions.createVehicle),
      exhaustMap(({ data }) =>
        this.api
          .post<Vehicle>('api/vehicles', clean(data as unknown as Record<string, unknown>))
          .pipe(
            map((vehicle) => {
              this.toast.success('TOAST.VEHICLE_ADDED');
              return VehiclesActions.createVehicleSuccess({ vehicle });
            }),
            catchError((err) => {
              this.toast.error('TOAST.VEHICLE_ADD_ERROR');
              return of(VehiclesActions.createVehicleFailure({ error: err?.message ?? 'Erreur' }));
            }),
          ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VehiclesActions.updateVehicle),
      exhaustMap(({ id, data }) =>
        this.api
          .put<Vehicle>(`api/vehicles/${id}`, clean(data as unknown as Record<string, unknown>))
          .pipe(
            map((vehicle) => {
              this.toast.success('TOAST.VEHICLE_UPDATED');
              return VehiclesActions.updateVehicleSuccess({ vehicle });
            }),
            catchError((err) => {
              this.toast.error('TOAST.VEHICLE_UPDATE_ERROR');
              return of(VehiclesActions.updateVehicleFailure({ error: err?.message ?? 'Erreur' }));
            }),
          ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VehiclesActions.deleteVehicle),
      exhaustMap(({ id }) =>
        this.api.delete<void>(`api/vehicles/${id}`).pipe(
          map(() => {
            this.toast.success('TOAST.VEHICLE_DELETED');
            return VehiclesActions.deleteVehicleSuccess({ id });
          }),
          catchError((err) => {
            this.toast.error('TOAST.VEHICLE_DELETE_ERROR');
            return of(VehiclesActions.deleteVehicleFailure({ error: err?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  uploadDoc$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VehiclesActions.uploadDocument),
      exhaustMap(({ id, formData }) =>
        this.api.postFormData<Vehicle>(`api/vehicles/${id}/documents`, formData).pipe(
          map((vehicle) => {
            this.toast.success('TOAST.DOC_ADDED');
            return VehiclesActions.uploadDocumentSuccess({ vehicle });
          }),
          catchError((err) => {
            this.toast.error('TOAST.VEHICLE_DOC_ADD_ERROR');
            return of(VehiclesActions.uploadDocumentFailure({ error: err?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  deleteDoc$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VehiclesActions.deleteDocument),
      exhaustMap(({ vehicleId, docId }) =>
        this.api.delete<Vehicle>(`api/vehicles/${vehicleId}/documents/${docId}`).pipe(
          map((vehicle) => {
            this.toast.success('TOAST.DOC_DELETED');
            return VehiclesActions.deleteDocumentSuccess({ vehicle });
          }),
          catchError((err) => {
            this.toast.error('TOAST.VEHICLE_DOC_DELETE_ERROR');
            return of(VehiclesActions.deleteDocumentFailure({ error: err?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );
}
