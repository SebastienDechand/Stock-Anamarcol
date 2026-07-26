import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeService } from './theme.service';

function stubMatchMedia(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to the OS light preference when nothing is saved', () => {
    stubMatchMedia(false);
    const service = new ThemeService();
    let isDark: boolean | undefined;
    service.isDark$.subscribe((v) => (isDark = v));
    expect(isDark).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('defaults to the OS dark preference when nothing is saved', () => {
    stubMatchMedia(true);
    const service = new ThemeService();
    let isDark: boolean | undefined;
    service.isDark$.subscribe((v) => (isDark = v));
    expect(isDark).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('prefers the saved theme over the OS preference', () => {
    stubMatchMedia(true);
    localStorage.setItem('theme', 'light');
    const service = new ThemeService();
    let isDark: boolean | undefined;
    service.isDark$.subscribe((v) => (isDark = v));
    expect(isDark).toBe(false);
  });

  it('toggle() flips the theme, updates the DOM attribute and persists to localStorage', () => {
    stubMatchMedia(false);
    const service = new ThemeService();
    service.toggle();

    let isDark: boolean | undefined;
    service.isDark$.subscribe((v) => (isDark = v));
    expect(isDark).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggle() twice returns to the original theme', () => {
    stubMatchMedia(false);
    const service = new ThemeService();
    service.toggle();
    service.toggle();

    let isDark: boolean | undefined;
    service.isDark$.subscribe((v) => (isDark = v));
    expect(isDark).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
