import { createReducer, on } from '@ngrx/store';
import { UiActions } from './ui.actions';
import { initialUiState } from './ui.state';

export const uiReducer = createReducer(
  initialUiState,
  on(UiActions.toggleSidebar, (state) => ({ ...state, sidebarOpen: !state.sidebarOpen })),
  on(UiActions.setSidebarOpen, (state, { open }) => ({ ...state, sidebarOpen: open })),
);
