import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Topbar } from './topbar';
import { AuthFacade } from '../../../store/auth/facade/auth.facade';
import { UiFacade } from '../../../store/ui/facade/ui.facade';
import { ThemeService } from '../../services/theme/theme.service';

describe('Topbar', () => {
  let component: Topbar;
  let hostElement: HTMLElement;
  let authFacade: { logout: ReturnType<typeof vi.fn> };
  let themeService: { toggle: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    TestBed.overrideComponent(Topbar, { set: { template: '', imports: [] } });

    authFacade = { logout: vi.fn() };
    themeService = { toggle: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [
        { provide: AuthFacade, useValue: authFacade },
        { provide: UiFacade, useValue: { toggleSidebar: vi.fn(), setSidebarOpen: vi.fn() } },
        { provide: ThemeService, useValue: themeService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    hostElement = fixture.nativeElement;
    document.body.appendChild(hostElement);
    fixture.detectChanges();
  });

  describe('getAvatarUrl()', () => {
    it('returns an empty string when there is no picture', () => {
      expect(component.getAvatarUrl(undefined)).toBe('');
    });

    it('returns the picture as-is when it is an absolute URL', () => {
      expect(component.getAvatarUrl('http://cdn.example.com/pic.jpg')).toBe(
        'http://cdn.example.com/pic.jpg',
      );
    });

    it('prefixes a relative path with the API URL', () => {
      expect(component.getAvatarUrl('uploads/pic.jpg')).toBe(`${component.apiUrl}uploads/pic.jpg`);
    });
  });

  describe('toggleMenu() / closeMenu()', () => {
    it('toggleMenu() flips menuOpen from closed to open', () => {
      component.toggleMenu();
      expect(component.menuOpen()).toBe(true);
    });

    it('toggleMenu() flips menuOpen from open to closed', () => {
      component.toggleMenu();
      component.toggleMenu();
      expect(component.menuOpen()).toBe(false);
    });

    it('closeMenu() always sets menuOpen to false', () => {
      component.toggleMenu();
      component.closeMenu();
      expect(component.menuOpen()).toBe(false);
    });
  });

  describe('toggleTheme()', () => {
    it('delegates to themeService.toggle() and closes the menu', () => {
      component.toggleMenu();
      component.toggleTheme();
      expect(themeService.toggle).toHaveBeenCalled();
      expect(component.menuOpen()).toBe(false);
    });
  });

  describe('logout()', () => {
    it('delegates to authFacade.logout() and closes the menu', () => {
      component.toggleMenu();
      component.logout();
      expect(authFacade.logout).toHaveBeenCalled();
      expect(component.menuOpen()).toBe(false);
    });
  });

  describe('onDocumentClick()', () => {
    it('closes the menu when clicking outside the host element', () => {
      component.toggleMenu();
      const outsideEl = document.createElement('div');
      document.body.appendChild(outsideEl);

      component.onDocumentClick({ target: outsideEl } as unknown as MouseEvent);

      expect(component.menuOpen()).toBe(false);
      outsideEl.remove();
    });

    it('keeps the menu open when clicking inside the host element', () => {
      component.toggleMenu();
      const innerEl = document.createElement('span');
      hostElement.appendChild(innerEl);

      component.onDocumentClick({ target: innerEl } as unknown as MouseEvent);

      expect(component.menuOpen()).toBe(true);
    });
  });
});
