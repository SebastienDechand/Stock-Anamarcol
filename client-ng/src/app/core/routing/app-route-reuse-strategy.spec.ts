import { describe, it, expect, beforeEach } from 'vitest';
import type { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { AppRouteReuseStrategy } from './app-route-reuse-strategy';

function makeSnapshot(overrides: Record<string, unknown> = {}): ActivatedRouteSnapshot {
  const { segment, ...rest } = overrides as { segment?: string };
  const base = {
    outlet: 'primary',
    component: class {},
    routeConfig: {},
    params: {},
    pathFromRoot: [{ url: [{ toString: () => segment ?? '' }] }],
    ...rest,
  };
  return base as unknown as ActivatedRouteSnapshot;
}

describe('AppRouteReuseStrategy', () => {
  let strategy: AppRouteReuseStrategy;

  beforeEach(() => {
    strategy = new AppRouteReuseStrategy();
  });

  describe('shouldReuseRoute()', () => {
    it('returns true when both snapshots share the same routeConfig', () => {
      const routeConfig = {};
      const future = makeSnapshot({ routeConfig });
      const curr = makeSnapshot({ routeConfig });
      expect(strategy.shouldReuseRoute(future, curr)).toBe(true);
    });

    it('returns false when the routeConfigs differ', () => {
      const future = makeSnapshot({ routeConfig: {} });
      const curr = makeSnapshot({ routeConfig: {} });
      expect(strategy.shouldReuseRoute(future, curr)).toBe(false);
    });
  });

  describe('shouldDetach()', () => {
    it('returns true for a leaf primary-outlet route with a component and no params', () => {
      const route = makeSnapshot();
      expect(strategy.shouldDetach(route)).toBe(true);
    });

    it('returns false for a non-primary outlet', () => {
      const route = makeSnapshot({ outlet: 'aux' });
      expect(strategy.shouldDetach(route)).toBe(false);
    });

    it('returns false when there is no component', () => {
      const route = makeSnapshot({ component: null });
      expect(strategy.shouldDetach(route)).toBe(false);
    });

    it('returns false when the route has child routes', () => {
      const route = makeSnapshot({ routeConfig: { children: [{}] } });
      expect(strategy.shouldDetach(route)).toBe(false);
    });

    it('returns false when the route lazy-loads children', () => {
      const route = makeSnapshot({ routeConfig: { loadChildren: () => Promise.resolve({}) } });
      expect(strategy.shouldDetach(route)).toBe(false);
    });

    it('returns false when the route has params (e.g. :id)', () => {
      const route = makeSnapshot({ params: { id: '123' } });
      expect(strategy.shouldDetach(route)).toBe(false);
    });
  });

  describe('store() / shouldAttach() / retrieve()', () => {
    it('shouldAttach() returns false for a route that was never stored', () => {
      const route = makeSnapshot({ segment: 'items' });
      expect(strategy.shouldAttach(route)).toBe(false);
    });

    it('stores a handle and makes it retrievable under the same key', () => {
      const route = makeSnapshot({ segment: 'items' });
      const handle = { some: 'handle' } as unknown as DetachedRouteHandle;

      strategy.store(route, handle);

      expect(strategy.shouldAttach(makeSnapshot({ segment: 'items' }))).toBe(true);
      expect(strategy.retrieve(makeSnapshot({ segment: 'items' }))).toBe(handle);
    });

    it('retrieve() returns null when nothing is stored for that route', () => {
      const route = makeSnapshot({ segment: 'items' });
      expect(strategy.retrieve(route)).toBeNull();
    });

    it('storing null for a route removes it from the cache', () => {
      const route = makeSnapshot({ segment: 'items' });
      const handle = { some: 'handle' } as unknown as DetachedRouteHandle;

      strategy.store(route, handle);
      strategy.store(makeSnapshot({ segment: 'items' }), null);

      expect(strategy.shouldAttach(makeSnapshot({ segment: 'items' }))).toBe(false);
    });

    it('uses distinct keys for distinct paths', () => {
      const itemsHandle = { page: 'items' } as unknown as DetachedRouteHandle;
      const contactsHandle = { page: 'contacts' } as unknown as DetachedRouteHandle;

      strategy.store(makeSnapshot({ segment: 'items' }), itemsHandle);
      strategy.store(makeSnapshot({ segment: 'contacts' }), contactsHandle);

      expect(strategy.retrieve(makeSnapshot({ segment: 'items' }))).toBe(itemsHandle);
      expect(strategy.retrieve(makeSnapshot({ segment: 'contacts' }))).toBe(contactsHandle);
    });
  });
});
