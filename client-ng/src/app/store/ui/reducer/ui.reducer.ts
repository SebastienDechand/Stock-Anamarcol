import { createReducer, on } from '@ngrx/store';
import { UiActions } from '../actions/ui.actions';
import { initialUiState } from '../state/ui.state';

export const uiReducer = createReducer(
  initialUiState,
  on(UiActions.toggleSidebar, (state) => ({ ...state, sidebarOpen: !state.sidebarOpen })),
  on(UiActions.setSidebarOpen, (state, { open }) => ({ ...state, sidebarOpen: open })),
);
