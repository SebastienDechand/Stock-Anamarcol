import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { Sidebar } from './sidebar';
import { AuthFacade } from '../../../store/auth/facade/auth.facade';
import { UiFacade } from '../../../store/ui/facade/ui.facade';

function buildComponent(flags: {
  isAdmin?: boolean;
  isHotline?: boolean;
  isMonteur?: boolean;
  isSuperadmin?: boolean;
}): {
  component: Sidebar;
  uiFacade: { toggleSidebar: ReturnType<typeof vi.fn>; setSidebarOpen: ReturnType<typeof vi.fn> };
} {
  const authFacade = {
    isAdmin$: of(!!flags.isAdmin),
    isHotline$: of(!!flags.isHotline),
    isMonteur$: of(!!flags.isMonteur),
    isSuperadmin$: of(!!flags.isSuperadmin),
  };
  const uiFacade = { toggleSidebar: vi.fn(), setSidebarOpen: vi.fn() };

  TestBed.overrideComponent(Sidebar, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({
    imports: [Sidebar],
    providers: [
      { provide: AuthFacade, useValue: authFacade },
      { provide: UiFacade, useValue: uiFacade },
    ],
  });

  const fixture = TestBed.createComponent(Sidebar);
  return { component: fixture.componentInstance, uiFacade };
}

function collectPaths(component: Sidebar): string[] {
  let items: { path: string }[] = [];
  component.navItems$.subscribe((v) => (items = v));
  return items.map((i) => i.path);
}

describe('Sidebar', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
  });

  describe('navItems$', () => {
    it('shows only the always-visible items for a plain user', () => {
      const { component } = buildComponent({});
      expect(collectPaths(component)).toEqual([
        '/home',
        '/items',
        '/members',
        '/contacts',
        '/profile',
      ]);
    });

    it('adds /shipments for hotline users', () => {
      const { component } = buildComponent({ isHotline: true });
      expect(collectPaths(component)).toContain('/shipments');
    });

    it('adds /client-files for monteur users', () => {
      const { component } = buildComponent({ isMonteur: true });
      expect(collectPaths(component)).toContain('/client-files');
    });

    it('adds /surveillance, /fleet and /history for admin users', () => {
      const { component } = buildComponent({ isAdmin: true });
      const paths = collectPaths(component);
      expect(paths).toContain('/surveillance');
      expect(paths).toContain('/fleet');
      expect(paths).toContain('/history');
    });

    it('adds /admin/roles for superadmin users', () => {
      const { component } = buildComponent({ isSuperadmin: true });
      expect(collectPaths(component)).toContain('/admin/roles');
    });

    it('shows every item when every role flag is true', () => {
      const { component } = buildComponent({
        isAdmin: true,
        isHotline: true,
        isMonteur: true,
        isSuperadmin: true,
      });
      expect(collectPaths(component)).toHaveLength(11);
    });
  });

  describe('toggle()', () => {
    it('delegates to uiFacade.toggleSidebar()', () => {
      const { component, uiFacade } = buildComponent({});
      component.toggle();
      expect(uiFacade.toggleSidebar).toHaveBeenCalled();
    });
  });

  describe('closeOnMobile()', () => {
    it('closes the sidebar when the viewport is narrower than 1024px', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      const { component, uiFacade } = buildComponent({});
      component.closeOnMobile();
      expect(uiFacade.setSidebarOpen).toHaveBeenCalledWith(false);
    });

    it('does nothing on a desktop-sized viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
      const { component, uiFacade } = buildComponent({});
      component.closeOnMobile();
      expect(uiFacade.setSidebarOpen).not.toHaveBeenCalled();
    });
  });
});
