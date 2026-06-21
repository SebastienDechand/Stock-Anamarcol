import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { StatisticsActions } from './statistics.actions';
import {
  selectDashboard,
  selectFournisseurStats,
  selectGlobalStats,
  selectLowStockItems,
  selectStatisticsLoading,
} from './statistics.selectors';

@Injectable({ providedIn: 'root' })
export class StatisticsFacade {
  private store = inject(Store);

  dashboard$ = this.store.select(selectDashboard);
  globalStats$ = this.store.select(selectGlobalStats);
  fournisseurStats$ = this.store.select(selectFournisseurStats);
  lowStockItems$ = this.store.select(selectLowStockItems);
  isLoading$ = combineLatest([
    this.store.select(selectStatisticsLoading),
    this.store.select(selectDashboard),
  ]).pipe(map(([loading, dashboard]) => loading && !dashboard));

  loadDashboard() {
    this.store.dispatch(StatisticsActions.loadDashboard());
  }
}
