import { describe, it, expect } from 'vitest';
import {
  selectHistoryEvents,
  selectHistoryUsers,
  selectHistoryIsLoading,
  selectHistoryIsPurging,
} from './history.selectors';
import { initialHistoryState } from '../state/history.state';
import type { AuditEvent } from '../../../../shared/models/audit/audit.model';

const sampleEvent: AuditEvent = {
  _id: 'e1',
  userName: 'Alice',
  action: 'create',
  entity: 'article',
  details: {},
  createdAt: new Date().toISOString(),
};

describe('History Selectors', () => {
  describe('selectHistoryEvents', () => {
    it('should return empty array from initial state', () => {
      const state = { history: initialHistoryState };
      expect(selectHistoryEvents(state)).toEqual([]);
    });

    it('should return events when populated', () => {
      const state = { history: { ...initialHistoryState, events: [sampleEvent] } };
      expect(selectHistoryEvents(state)).toEqual([sampleEvent]);
    });
  });

  describe('selectHistoryUsers', () => {
    it('should return empty array from initial state', () => {
      const state = { history: initialHistoryState };
      expect(selectHistoryUsers(state)).toEqual([]);
    });

    it('should return users when populated', () => {
      const users = [{ _id: 'u1', username: 'alice' }];
      const state = { history: { ...initialHistoryState, users } };
      expect(selectHistoryUsers(state)).toEqual(users);
    });
  });

  describe('selectHistoryIsLoading', () => {
    it('should return false from initial state', () => {
      const state = { history: initialHistoryState };
      expect(selectHistoryIsLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = { history: { ...initialHistoryState, isLoading: true } };
      expect(selectHistoryIsLoading(state)).toBe(true);
    });
  });

  describe('selectHistoryIsPurging', () => {
    it('should return false from initial state', () => {
      const state = { history: initialHistoryState };
      expect(selectHistoryIsPurging(state)).toBe(false);
    });

    it('should return true when purging', () => {
      const state = { history: { ...initialHistoryState, isPurging: true } };
      expect(selectHistoryIsPurging(state)).toBe(true);
    });
  });
});
