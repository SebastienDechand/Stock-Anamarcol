import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { AuditEvent } from '../../../../shared/models/audit/audit.model';
import { HistoryActions } from '../actions/history.actions';
import { HistoryUser } from '../state/history.state';

@Injectable()
export class HistoryEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loadEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HistoryActions.loadEvents),
      exhaustMap(() =>
        this.api.get<AuditEvent[]>('api/history/').pipe(
          map((events) => HistoryActions.loadEventsSuccess({ events: events ?? [] })),
          catchError((error) =>
            of(HistoryActions.loadEventsFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HistoryActions.loadUsers),
      exhaustMap(() =>
        this.api.get<HistoryUser[]>('api/user/').pipe(
          map((users) => HistoryActions.loadUsersSuccess({ users: users ?? [] })),
          catchError((error) =>
            of(HistoryActions.loadUsersFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  purge$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HistoryActions.purge),
      exhaustMap(() =>
        this.api.post<void>('api/history/purge', {}).pipe(
          map(() => {
            this.toast.success('HISTORY.PURGED');
            return HistoryActions.purgeSuccess();
          }),
          catchError((error) => {
            this.toast.error('HISTORY.PURGE_ERROR');
            return of(HistoryActions.purgeFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );
}
