import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from './app';
import { AuthActions } from './store/auth/actions/auth.actions';
import { selectIsAuthenticated } from './store/auth/selectors/auth.selectors';

describe('App', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideMockStore({ initialState: { auth: { status: 'idle' } } })],
    }).compileComponents();
    store = TestBed.inject(MockStore);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  describe('session re-check on tab visibility', () => {
    function setVisibility(state: DocumentVisibilityState) {
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }

    it('dispatches verifySession when the tab becomes visible while authenticated', () => {
      store.overrideSelector(selectIsAuthenticated, true);
      store.refreshState();
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      TestBed.createComponent(App);
      setVisibility('visible');

      expect(dispatchSpy).toHaveBeenCalledWith(AuthActions.verifySession());
    });

    it('does not dispatch verifySession when the tab becomes visible while unauthenticated', () => {
      store.overrideSelector(selectIsAuthenticated, false);
      store.refreshState();
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      TestBed.createComponent(App);
      setVisibility('visible');

      expect(dispatchSpy).not.toHaveBeenCalledWith(AuthActions.verifySession());
    });

    it('does not dispatch verifySession when the tab becomes hidden', () => {
      store.overrideSelector(selectIsAuthenticated, true);
      store.refreshState();
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      TestBed.createComponent(App);
      setVisibility('hidden');

      expect(dispatchSpy).not.toHaveBeenCalledWith(AuthActions.verifySession());
    });
  });
});
