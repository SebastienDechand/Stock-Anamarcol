import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

function stubNavigatorLanguage(lang: string): void {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(lang);
}

function buildService(): {
  service: LanguageService;
  translate: {
    addLangs: ReturnType<typeof vi.fn>;
    use: ReturnType<typeof vi.fn>;
  };
} {
  const translate = { addLangs: vi.fn(), use: vi.fn() };
  TestBed.configureTestingModule({
    providers: [{ provide: TranslateService, useValue: translate }],
  });
  return { service: TestBed.inject(LanguageService), translate };
}

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to fr when nothing is saved and the browser is not English', () => {
    stubNavigatorLanguage('de-DE');
    const { service } = buildService();
    expect(service.current).toBe('fr');
  });

  it('defaults to en when the browser language is English and nothing is saved', () => {
    stubNavigatorLanguage('en-US');
    const { service } = buildService();
    expect(service.current).toBe('en');
  });

  it('prefers the saved language over the browser language', () => {
    stubNavigatorLanguage('en-US');
    localStorage.setItem('lang', 'fr');
    const { service } = buildService();
    expect(service.current).toBe('fr');
  });

  it('registers fr/en with ngx-translate and activates the initial language on construction', () => {
    stubNavigatorLanguage('fr-FR');
    const { translate } = buildService();
    expect(translate.addLangs).toHaveBeenCalledWith(['fr', 'en']);
    expect(translate.use).toHaveBeenCalledWith('fr');
  });

  it('toggle() switches from fr to en', () => {
    stubNavigatorLanguage('fr-FR');
    const { service } = buildService();
    service.toggle();
    expect(service.current).toBe('en');
  });

  it('toggle() switches from en back to fr', () => {
    stubNavigatorLanguage('fr-FR');
    localStorage.setItem('lang', 'en');
    const { service } = buildService();
    service.toggle();
    expect(service.current).toBe('fr');
  });

  it('set() updates lang$, ngx-translate, localStorage and the <html lang> attribute', () => {
    stubNavigatorLanguage('fr-FR');
    const { service, translate } = buildService();

    let emitted: string | undefined;
    service.lang$.subscribe((lang) => (emitted = lang));

    service.set('en');

    expect(emitted).toBe('en');
    expect(translate.use).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('lang')).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });
});
