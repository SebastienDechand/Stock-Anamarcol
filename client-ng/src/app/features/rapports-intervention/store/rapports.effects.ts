import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/toast/toast.service';
import { InterventionReport } from '../../../shared/models/intervention-report.model';
import { RapportsActions } from './rapports.actions';

@Injectable()
export class RapportsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loadAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RapportsActions.loadAll),
      exhaustMap(() =>
        this.api.get<InterventionReport[]>('api/intervention-reports').pipe(
          map((rapports) => RapportsActions.loadAllSuccess({ rapports })),
          catchError((error) =>
            of(RapportsActions.loadAllFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  loadByClientFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RapportsActions.loadByClientFile),
      switchMap(({ clientFileId }) =>
        this.api.get<InterventionReport[]>('api/intervention-reports', { clientFileId }).pipe(
          map((rapports) => RapportsActions.loadByClientFileSuccess({ rapports })),
          catchError(() => of(RapportsActions.loadByClientFileSuccess({ rapports: [] }))),
        ),
      ),
    ),
  );

  loadOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RapportsActions.loadOne),
      switchMap(({ id }) =>
        this.api.get<InterventionReport>(`api/intervention-reports/${id}`).pipe(
          map((rapport) => RapportsActions.loadOneSuccess({ rapport })),
          catchError(() => of(RapportsActions.loadAllFailure({ error: 'Erreur' }))),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RapportsActions.createRapport),
      exhaustMap(({ data }) =>
        this.api.post<InterventionReport>('api/intervention-reports', data).pipe(
          map((rapport) => {
            this.toast.success('TOAST.RAPPORT_CREATED');
            return RapportsActions.createRapportSuccess({ rapport });
          }),
          catchError((error) => {
            this.toast.error('TOAST.RAPPORT_CREATE_ERROR');
            return of(RapportsActions.createRapportFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RapportsActions.updateRapport),
      exhaustMap(({ id, data }) =>
        this.api.put<InterventionReport>(`api/intervention-reports/${id}`, data).pipe(
          map((rapport) => {
            this.toast.success('TOAST.RAPPORT_UPDATED');
            return RapportsActions.updateRapportSuccess({ rapport });
          }),
          catchError((error) => {
            this.toast.error('TOAST.RAPPORT_UPDATE_ERROR');
            return of(RapportsActions.updateRapportFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RapportsActions.deleteRapport),
      exhaustMap(({ id }) =>
        this.api.delete<void>(`api/intervention-reports/${id}`).pipe(
          map(() => {
            this.toast.success('TOAST.RAPPORT_DELETED');
            return RapportsActions.deleteRapportSuccess({ id });
          }),
          catchError((error) => {
            this.toast.error('TOAST.RAPPORT_DELETE_ERROR');
            return of(RapportsActions.deleteRapportFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );
}
