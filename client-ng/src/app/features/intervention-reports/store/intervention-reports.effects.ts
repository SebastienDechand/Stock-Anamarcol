import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/toast/toast.service';
import { InterventionReport } from '../../../shared/models/intervention-report.model';
import { InterventionReportsActions } from './intervention-reports.actions';

@Injectable()
export class InterventionReportsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loadAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterventionReportsActions.loadAll),
      exhaustMap(() =>
        this.api.get<InterventionReport[]>('api/intervention-reports').pipe(
          map((reports) => InterventionReportsActions.loadAllSuccess({ reports })),
          catchError((error) =>
            of(InterventionReportsActions.loadAllFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  loadByClientFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterventionReportsActions.loadByClientFile),
      switchMap(({ clientFileId }) =>
        this.api.get<InterventionReport[]>('api/intervention-reports', { clientFileId }).pipe(
          map((reports) => InterventionReportsActions.loadByClientFileSuccess({ reports })),
          catchError(() => of(InterventionReportsActions.loadByClientFileSuccess({ reports: [] }))),
        ),
      ),
    ),
  );

  loadOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterventionReportsActions.loadOne),
      switchMap(({ id }) =>
        this.api.get<InterventionReport>(`api/intervention-reports/${id}`).pipe(
          map((report) => InterventionReportsActions.loadOneSuccess({ report })),
          catchError(() => of(InterventionReportsActions.loadAllFailure({ error: 'Erreur' }))),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterventionReportsActions.createReport),
      exhaustMap(({ data }) =>
        this.api.post<InterventionReport>('api/intervention-reports', data).pipe(
          map((report) => {
            this.toast.success('TOAST.REPORT_CREATED');
            return InterventionReportsActions.createReportSuccess({ report });
          }),
          catchError((error) => {
            this.toast.error('TOAST.REPORT_CREATE_ERROR');
            return of(
              InterventionReportsActions.createReportFailure({
                error: error?.message ?? 'Erreur',
              }),
            );
          }),
        ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterventionReportsActions.updateReport),
      exhaustMap(({ id, data }) =>
        this.api.put<InterventionReport>(`api/intervention-reports/${id}`, data).pipe(
          map((report) => {
            this.toast.success('TOAST.REPORT_UPDATED');
            return InterventionReportsActions.updateReportSuccess({ report });
          }),
          catchError((error) => {
            this.toast.error('TOAST.REPORT_UPDATE_ERROR');
            return of(
              InterventionReportsActions.updateReportFailure({
                error: error?.message ?? 'Erreur',
              }),
            );
          }),
        ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterventionReportsActions.deleteReport),
      exhaustMap(({ id }) =>
        this.api.delete<void>(`api/intervention-reports/${id}`).pipe(
          map(() => {
            this.toast.success('TOAST.REPORT_DELETED');
            return InterventionReportsActions.deleteReportSuccess({ id });
          }),
          catchError((error) => {
            this.toast.error('TOAST.REPORT_DELETE_ERROR');
            return of(
              InterventionReportsActions.deleteReportFailure({
                error: error?.message ?? 'Erreur',
              }),
            );
          }),
        ),
      ),
    ),
  );
}
