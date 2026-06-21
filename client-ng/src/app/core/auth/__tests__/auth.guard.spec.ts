import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { authGuard } from '../auth.guard';
import { selectAuthStatus } from '../../../store/auth/auth.selectors';

const mockCreateUrlTree = vi.fn().mockReturnValue({});

async function resolveGuardResult<T>(value: T | Observable<T> | Promise<T>): Promise<T> {
  if (isObservable(value)) return firstValueFrom(value);
  if (value instanceof Promise) return value;
  return Promise.resolve(value);
}

describe('authGuard', () => {
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
      authGuard(
        Object.create(ActivatedRouteSnapshot.prototype),
        Object.create(RouterStateSnapshot.prototype),
      ),
    );
  }

  it('should allow access when status is authenticated', async () => {
    store.overrideSelector(selectAuthStatus, 'authenticated');
    store.refreshState();

    const result = await resolveGuardResult(callGuard());
    expect(result).toBe(true);
  });

  it('should redirect to / when status is unauthenticated', async () => {
    store.overrideSelector(selectAuthStatus, 'unauthenticated');
    store.refreshState();

    const result = await resolveGuardResult(callGuard());
    expect(result).not.toBe(true);
    expect(mockCreateUrlTree).toHaveBeenCalledWith(['/']);
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

  it('should emit when status transitions from loading to authenticated', async () => {
    store.overrideSelector(selectAuthStatus, 'loading');
    store.refreshState();

    const resultPromise = resolveGuardResult(callGuard());

    store.overrideSelector(selectAuthStatus, 'authenticated');
    store.refreshState();

    const result = await resultPromise;
    expect(result).toBe(true);
  });
});
