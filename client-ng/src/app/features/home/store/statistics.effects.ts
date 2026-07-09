import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { DashboardStats } from '../../../shared/models/statistics.model';
import { StatisticsActions } from './statistics.actions';

@Injectable()
export class StatisticsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  loadDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StatisticsActions.loadDashboard),
      exhaustMap(() =>
        this.api.get<DashboardStats>('api/statistics/dashboard').pipe(
          map((data) => StatisticsActions.loadDashboardSuccess({ data })),
          catchError((err) =>
            of(StatisticsActions.loadDashboardFailure({ error: err?.message ?? 'Erreur stats' })),
          ),
        ),
      ),
    ),
  );
}
