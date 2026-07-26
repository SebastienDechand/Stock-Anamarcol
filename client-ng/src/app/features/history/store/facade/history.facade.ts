import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { HistoryActions } from '../actions/history.actions';
import {
  selectHistoryEvents,
  selectHistoryIsLoading,
  selectHistoryIsPurging,
  selectHistoryUsers,
} from '../selectors/history.selectors';

@Injectable({ providedIn: 'root' })
export class HistoryFacade {
  private store = inject(Store);

  events$ = this.store.select(selectHistoryEvents);
  users$ = this.store.select(selectHistoryUsers);
  isLoading$ = this.store.select(selectHistoryIsLoading);
  isPurging$ = this.store.select(selectHistoryIsPurging);

  loadEvents(): void {
    this.store.dispatch(HistoryActions.loadEvents());
  }

  loadUsers(): void {
    this.store.dispatch(HistoryActions.loadUsers());
  }

  purge(): void {
    this.store.dispatch(HistoryActions.purge());
  }
}
