import { describe, it, expect } from 'vitest';
import { selectSidebarOpen } from '../ui.selectors';
import { initialUiState } from '../ui.state';

describe('UI Selectors', () => {
  describe('selectSidebarOpen', () => {
    it('should return false from initial state', () => {
      const state = { ui: initialUiState };
      expect(selectSidebarOpen(state)).toBe(false);
    });

    it('should return true when sidebar is open', () => {
      const state = { ui: { ...initialUiState, sidebarOpen: true } };
      expect(selectSidebarOpen(state)).toBe(true);
    });

    it('should return false when sidebar is explicitly closed', () => {
      const state = { ui: { ...initialUiState, sidebarOpen: false } };
      expect(selectSidebarOpen(state)).toBe(false);
    });
  });
});
