import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { roleGuard } from '../role.guard';
import {
  selectAuthStatus,
  selectIsAdmin,
  selectIsHotline,
  selectIsMonteur,
  selectIsSuperadmin,
} from '../../../store/auth/auth.selectors';

const mockCreateUrlTree = vi.fn().mockReturnValue({});

async function resolveGuardResult<T>(value: T | Observable<T> | Promise<T>): Promise<T> {
  if (isObservable(value)) return firstValueFrom(value);
  if (value instanceof Promise) return value;
  return Promise.resolve(value);
}

describe('roleGuard', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          initialState: {
            auth: {
              status: 'authenticated',
              isAdmin: false,
              isSuperadmin: false,
              isHotline: false,
              isMonteur: false,
            },
          },
        }),
        {
          provide: Router,
          useValue: { createUrlTree: mockCreateUrlTree, navigate: vi.fn() },
        },
      ],
    });
    store = TestBed.inject(MockStore);
    mockCreateUrlTree.mockClear();
  });

  afterEach(() => {
    store.resetSelectors();
  });

  function callGuard(role: Parameters<typeof roleGuard>[0]) {
    const guard = roleGuard(role);
    return TestBed.runInInjectionContext(() =>
      guard(
        Object.create(ActivatedRouteSnapshot.prototype),
        Object.create(RouterStateSnapshot.prototype),
      ),
    );
  }

  describe('admin role', () => {
    it('should allow access when user is admin', async () => {
      store.overrideSelector(selectAuthStatus, 'authenticated');
      store.overrideSelector(selectIsAdmin, true);
      store.refreshState();

      const result = await resolveGuardResult(callGuard('admin'));
      expect(result).toBe(true);
    });

    it('should redirect to /home when user is not admin', async () => {
      store.overrideSelector(selectAuthStatus, 'authenticated');
      store.overrideSelector(selectIsAdmin, false);
      store.refreshState();

      const result = await resolveGuardResult(callGuard('admin'));
      expect(result).not.toBe(true);
      expect(mockCreateUrlTree).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('superadmin role', () => {
    it('should allow access when user is superadmin', async () => {
      store.overrideSelector(selectAuthStatus, 'authenticated');
      store.overrideSelector(selectIsSuperadmin, true);
      store.refreshState();

      const result = await resolveGuardResult(callGuard('superadmin'));
      expect(result).toBe(true);
    });

    it('should redirect to /home when user is not superadmin', async () => {
      store.overrideSelector(selectAuthStatus, 'authenticated');
      store.overrideSelector(selectIsSuperadmin, false);
      store.refreshState();

      const result = await resolveGuardResult(callGuard('superadmin'));
      expect(result).not.toBe(true);
      expect(mockCreateUrlTree).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('hotline role', () => {
    it('should allow access when user is hotline', async () => {
      store.overrideSelector(selectAuthStatus, 'authenticated');
      store.overrideSelector(selectIsHotline, true);
      store.refreshState();

      const result = await resolveGuardResult(callGuard('hotline'));
      expect(result).toBe(true);
    });

    it('should redirect to /home when user does not have hotline role', async () => {
      store.overrideSelector(selectAuthStatus, 'authenticated');
      store.overrideSelector(selectIsHotline, false);
      store.refreshState();

      const result = await resolveGuardResult(callGuard('hotline'));
      expect(result).not.toBe(true);
      expect(mockCreateUrlTree).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('monteur role', () => {
    it('should allow access when user is monteur', async () => {
      store.overrideSelector(selectAuthStatus, 'authenticated');
      store.overrideSelector(selectIsMonteur, true);
      store.refreshState();

      const result = await resolveGuardResult(callGuard('monteur'));
      expect(result).toBe(true);
    });

    it('should redirect to /home when user does not have monteur role', async () => {
      store.overrideSelector(selectAuthStatus, 'authenticated');
      store.overrideSelector(selectIsMonteur, false);
      store.refreshState();

      const result = await resolveGuardResult(callGuard('monteur'));
      expect(result).not.toBe(true);
      expect(mockCreateUrlTree).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('loading/idle states', () => {
    it('should not emit while status is loading', () => {
      store.overrideSelector(selectAuthStatus, 'loading');
      store.overrideSelector(selectIsAdmin, false);
      store.refreshState();

      const guardResult = callGuard('admin');
      expect(isObservable(guardResult)).toBe(true);
      if (!isObservable(guardResult)) return;

      let emitted = false;
      const sub = guardResult.subscribe(() => {
        emitted = true;
      });
      expect(emitted).toBe(false);
      sub.unsubscribe();
    });

    it('should not emit while status is idle', () => {
      store.overrideSelector(selectAuthStatus, 'idle');
      store.overrideSelector(selectIsAdmin, false);
      store.refreshState();

      const guardResult = callGuard('admin');
      expect(isObservable(guardResult)).toBe(true);
      if (!isObservable(guardResult)) return;

      let emitted = false;
      const sub = guardResult.subscribe(() => {
        emitted = true;
      });
      expect(emitted).toBe(false);
      sub.unsubscribe();
    });

    it('should emit when status transitions from loading to authenticated', async () => {
      store.overrideSelector(selectAuthStatus, 'loading');
      store.overrideSelector(selectIsAdmin, true);
      store.refreshState();

      const resultPromise = resolveGuardResult(callGuard('admin'));

      store.overrideSelector(selectAuthStatus, 'authenticated');
      store.refreshState();

      const result = await resultPromise;
      expect(result).toBe(true);
    });
  });
});
