import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { UiActions } from './ui.actions';
import { selectSidebarOpen } from './ui.selectors';

@Injectable({ providedIn: 'root' })
export class UiFacade {
  private store = inject(Store);

  sidebarOpen$ = this.store.select(selectSidebarOpen);

  toggleSidebar() {
    this.store.dispatch(UiActions.toggleSidebar());
  }

  setSidebarOpen(open: boolean) {
    this.store.dispatch(UiActions.setSidebarOpen({ open }));
  }
}
