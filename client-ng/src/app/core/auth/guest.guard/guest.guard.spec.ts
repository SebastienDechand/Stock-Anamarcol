import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { guestGuard } from './guest.guard';
import { selectAuthStatus } from '../../../store/auth/selectors/auth.selectors';

const mockCreateUrlTree = vi.fn().mockReturnValue({});

async function resolveGuardResult<T>(value: T | Observable<T> | Promise<T>): Promise<T> {
  if (isObservable(value)) return firstValueFrom(value);
  if (value instanceof Promise) return value;
  return Promise.resolve(value);
}

describe('guestGuard', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({ initialState: { auth: { status: 'unauthenticated' } } }),
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

  function callGuard() {
    return TestBed.runInInjectionContext(() =>
      guestGuard(
        Object.create(ActivatedRouteSnapshot.prototype),
        Object.create(RouterStateSnapshot.prototype),
      ),
    );
  }

  it('should allow access to the login page when unauthenticated', async () => {
    store.overrideSelector(selectAuthStatus, 'unauthenticated');
    store.refreshState();

    const result = await resolveGuardResult(callGuard());
    expect(result).toBe(true);
  });

  it('should redirect to /home when already authenticated', async () => {
    store.overrideSelector(selectAuthStatus, 'authenticated');
    store.refreshState();

    const result = await resolveGuardResult(callGuard());
    expect(result).not.toBe(true);
    expect(mockCreateUrlTree).toHaveBeenCalledWith(['/home']);
  });

  it('should not emit while status is loading', () => {
    store.overrideSelector(selectAuthStatus, 'loading');
    store.refreshState();

    const guardResult = callGuard();
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
    store.refreshState();

    const guardResult = callGuard();
    expect(isObservable(guardResult)).toBe(true);
    if (!isObservable(guardResult)) return;

    let emitted = false;
    const sub = guardResult.subscribe(() => {
      emitted = true;
    });
    expect(emitted).toBe(false);
    sub.unsubscribe();
  });
});
