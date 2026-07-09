import { describe, it, expect } from 'vitest';
import { uiReducer } from '../ui.reducer';
import { UiActions } from '../ui.actions';
import { initialUiState } from '../ui.state';

describe('uiReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = uiReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialUiState);
  });

  it('should toggle the sidebar from closed to open', () => {
    const state = uiReducer(initialUiState, UiActions.toggleSidebar());
    expect(state.sidebarOpen).toBe(true);
  });

  it('should toggle the sidebar from open to closed', () => {
    const state = uiReducer({ sidebarOpen: true }, UiActions.toggleSidebar());
    expect(state.sidebarOpen).toBe(false);
  });

  it('should set the sidebar open state explicitly', () => {
    const opened = uiReducer(initialUiState, UiActions.setSidebarOpen({ open: true }));
    expect(opened.sidebarOpen).toBe(true);

    const closed = uiReducer(opened, UiActions.setSidebarOpen({ open: false }));
    expect(closed.sidebarOpen).toBe(false);
  });
});
