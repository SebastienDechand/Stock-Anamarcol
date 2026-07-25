import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { StatisticsEffects } from './statistics.effects';
import { StatisticsActions } from '../actions/statistics.actions';
import { ApiService } from '../../../../core/http/api.service';
import type { DashboardStats } from '../../../../shared/models/statistics/statistics.model';

const sampleDashboard: DashboardStats = {
  global: {
    numberOfArticles: 120,
    totalStock: 3450,
    numberOfSuppliers: 8,
    numberOfLowStockArticles: 5,
    cgKit: 12,
    tpvKit: 7,
  },
  suppliers: [
    {
      numberOfArticles: 40,
      totalStock: 1200,
      numberOfLowStockArticles: 2,
      name: 'Alpha',
    },
    {
      numberOfArticles: 80,
      totalStock: 2250,
      numberOfLowStockArticles: 3,
      name: 'Beta',
    },
  ],
  lowStockItems: [
    {
      _id: 'i1',
      name: 'Écran tactile 15"',
      supplier: 'Alpha',
      status: 'Neuf',
      quantity: 1,
    },
    {
      _id: 'i2',
      name: 'Tiroir caisse USB',
      supplier: 'Beta',
      status: 'Reconditionné',
      quantity: 2,
    },
  ],
};

describe('StatisticsEffects', () => {
  let effects: StatisticsEffects;
  let actions$: Subject<Action>;
  let apiService: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    apiService = { get: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        StatisticsEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ApiService, useValue: apiService },
      ],
    });

    effects = TestBed.inject(StatisticsEffects);
  });

  describe('loadDashboard$', () => {
    it('should dispatch loadDashboardSuccess with data on success', async () => {
      apiService.get.mockReturnValue(of(sampleDashboard));

      const loadDashboardPromise = firstValueFrom(effects.loadDashboard$);
      actions$.next(StatisticsActions.loadDashboard());
      const result = await loadDashboardPromise;

      expect(result).toEqual(StatisticsActions.loadDashboardSuccess({ data: sampleDashboard }));
    });

    it('should call api.get with the correct endpoint', async () => {
      apiService.get.mockReturnValue(of(sampleDashboard));

      const loadDashboardPromise = firstValueFrom(effects.loadDashboard$);
      actions$.next(StatisticsActions.loadDashboard());
      await loadDashboardPromise;

      expect(apiService.get).toHaveBeenCalledWith('api/statistics/dashboard');
    });

    it('should dispatch loadDashboardFailure with error message on failure', async () => {
      const error = new Error('Network error');
      apiService.get.mockReturnValue(throwError(() => error));

      const loadDashboardPromise = firstValueFrom(effects.loadDashboard$);
      actions$.next(StatisticsActions.loadDashboard());
      const result = await loadDashboardPromise;

      expect(result).toEqual(StatisticsActions.loadDashboardFailure({ error: 'Network error' }));
    });

    it('should dispatch loadDashboardFailure with fallback message when error has no message', async () => {
      apiService.get.mockReturnValue(throwError(() => null));

      const loadDashboardPromise = firstValueFrom(effects.loadDashboard$);
      actions$.next(StatisticsActions.loadDashboard());
      const result = await loadDashboardPromise;

      expect(result).toEqual(StatisticsActions.loadDashboardFailure({ error: 'Erreur stats' }));
    });

    it('should use exhaustMap and ignore subsequent actions while one is in flight', async () => {
      // Use a Subject so the inner observable stays active during the second dispatch
      const apiSubject = new Subject<DashboardStats>();
      apiService.get.mockReturnValue(apiSubject);

      const loadDashboardPromise = firstValueFrom(effects.loadDashboard$);
      actions$.next(StatisticsActions.loadDashboard()); // starts inner observable (not yet complete)
      actions$.next(StatisticsActions.loadDashboard()); // exhaustMap ignores this

      apiSubject.next(sampleDashboard);
      apiSubject.complete();
      await loadDashboardPromise;

      expect(apiService.get).toHaveBeenCalledTimes(1);
    });
  });
});
