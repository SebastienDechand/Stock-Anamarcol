import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { HistoryEffects } from './history.effects';
import { HistoryActions } from '../actions/history.actions';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import type { AuditEvent } from '../../../../shared/models/audit/audit.model';

const mockEvents: AuditEvent[] = [
  {
    _id: 'e1',
    userName: 'Alice',
    action: 'create',
    entity: 'article',
    details: {},
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const mockUsers = [{ _id: 'u1', username: 'alice' }];

describe('HistoryEffects', () => {
  let effects: HistoryEffects;
  let actions$: Subject<Action>;
  let api: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    api = { get: vi.fn(), post: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        HistoryEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    effects = TestBed.inject(HistoryEffects);
  });

  describe('loadEvents$', () => {
    it('should dispatch loadEventsSuccess on success', async () => {
      api.get.mockReturnValue(of(mockEvents));

      const promise = firstValueFrom(effects.loadEvents$);
      actions$.next(HistoryActions.loadEvents());
      const result = await promise;

      expect(api.get).toHaveBeenCalledWith('api/history/');
      expect(result).toEqual(HistoryActions.loadEventsSuccess({ events: mockEvents }));
    });

    it('should dispatch loadEventsFailure with error message on failure', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Network error')));

      const promise = firstValueFrom(effects.loadEvents$);
      actions$.next(HistoryActions.loadEvents());
      const result = await promise;

      expect(result).toEqual(HistoryActions.loadEventsFailure({ error: 'Network error' }));
    });

    it('should dispatch loadEventsFailure with fallback message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => ({})));

      const promise = firstValueFrom(effects.loadEvents$);
      actions$.next(HistoryActions.loadEvents());
      const result = await promise;

      expect(result).toEqual(HistoryActions.loadEventsFailure({ error: 'Erreur' }));
    });
  });

  describe('loadUsers$', () => {
    it('should dispatch loadUsersSuccess on success', async () => {
      api.get.mockReturnValue(of(mockUsers));

      const promise = firstValueFrom(effects.loadUsers$);
      actions$.next(HistoryActions.loadUsers());
      const result = await promise;

      expect(api.get).toHaveBeenCalledWith('api/user/');
      expect(result).toEqual(HistoryActions.loadUsersSuccess({ users: mockUsers }));
    });

    it('should dispatch loadUsersFailure with fallback message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => null));

      const promise = firstValueFrom(effects.loadUsers$);
      actions$.next(HistoryActions.loadUsers());
      const result = await promise;

      expect(result).toEqual(HistoryActions.loadUsersFailure({ error: 'Erreur' }));
    });
  });

  describe('purge$', () => {
    it('should dispatch purgeSuccess and call toast.success on success', async () => {
      api.post.mockReturnValue(of(undefined));

      const promise = firstValueFrom(effects.purge$);
      actions$.next(HistoryActions.purge());
      const result = await promise;

      expect(api.post).toHaveBeenCalledWith('api/history/purge', {});
      expect(toast.success).toHaveBeenCalledWith('HISTORY.PURGED');
      expect(result).toEqual(HistoryActions.purgeSuccess());
    });

    it('should dispatch purgeFailure and call toast.error on failure', async () => {
      api.post.mockReturnValue(throwError(() => new Error('Purge failed')));

      const promise = firstValueFrom(effects.purge$);
      actions$.next(HistoryActions.purge());
      const result = await promise;

      expect(toast.error).toHaveBeenCalledWith('HISTORY.PURGE_ERROR');
      expect(result).toEqual(HistoryActions.purgeFailure({ error: 'Purge failed' }));
    });

    it('should dispatch purgeFailure with fallback message when error has no message', async () => {
      api.post.mockReturnValue(throwError(() => undefined));

      const promise = firstValueFrom(effects.purge$);
      actions$.next(HistoryActions.purge());
      const result = await promise;

      expect(result).toEqual(HistoryActions.purgeFailure({ error: 'Erreur' }));
    });
  });
});
