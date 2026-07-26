import { describe, it, expect } from 'vitest';
import { historyReducer } from './history.reducer';
import { HistoryActions } from '../actions/history.actions';
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

describe('historyReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = historyReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialHistoryState);
  });

  it('should set isLoading to true on loadEvents when there are no events yet', () => {
    const state = historyReducer(initialHistoryState, HistoryActions.loadEvents());
    expect(state.isLoading).toBe(true);
  });

  it('should not set isLoading on loadEvents when events are already present (silent refresh)', () => {
    const state = historyReducer(
      { ...initialHistoryState, events: [sampleEvent] },
      HistoryActions.loadEvents(),
    );
    expect(state.isLoading).toBe(false);
  });

  it('should handle loadEventsSuccess by setting events and clearing isLoading', () => {
    const state = historyReducer(
      { ...initialHistoryState, isLoading: true },
      HistoryActions.loadEventsSuccess({ events: [sampleEvent] }),
    );
    expect(state.events).toEqual([sampleEvent]);
    expect(state.isLoading).toBe(false);
  });

  it('should handle loadEventsFailure by clearing isLoading', () => {
    const state = historyReducer(
      { ...initialHistoryState, isLoading: true },
      HistoryActions.loadEventsFailure({ error: 'Erreur réseau' }),
    );
    expect(state.isLoading).toBe(false);
  });

  it('should handle loadUsersSuccess by setting users', () => {
    const users = [{ _id: 'u1', username: 'alice' }];
    const state = historyReducer(initialHistoryState, HistoryActions.loadUsersSuccess({ users }));
    expect(state.users).toEqual(users);
  });

  it('should set isPurging to true on purge', () => {
    const state = historyReducer(initialHistoryState, HistoryActions.purge());
    expect(state.isPurging).toBe(true);
  });

  it('should handle purgeSuccess by clearing events and isPurging', () => {
    const state = historyReducer(
      { ...initialHistoryState, events: [sampleEvent], isPurging: true },
      HistoryActions.purgeSuccess(),
    );
    expect(state.events).toEqual([]);
    expect(state.isPurging).toBe(false);
  });

  it('should handle purgeFailure by clearing isPurging without touching events', () => {
    const state = historyReducer(
      { ...initialHistoryState, events: [sampleEvent], isPurging: true },
      HistoryActions.purgeFailure({ error: 'Erreur réseau' }),
    );
    expect(state.events).toEqual([sampleEvent]);
    expect(state.isPurging).toBe(false);
  });
});
