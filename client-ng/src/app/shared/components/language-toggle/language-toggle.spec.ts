import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { LanguageToggle } from './language-toggle';
import { LanguageService } from '../../../core/services/language/language.service';

describe('LanguageToggle', () => {
  let component: LanguageToggle;
  let languageService: { lang$: unknown; toggle: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    TestBed.overrideComponent(LanguageToggle, { set: { template: '', imports: [] } });

    languageService = { lang$: of('fr'), toggle: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LanguageToggle],
      providers: [{ provide: LanguageService, useValue: languageService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LanguageToggle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes lang$ from the language service', () => {
    let emitted: string | undefined;
    component.lang$.subscribe((lang) => (emitted = lang));
    expect(emitted).toBe('fr');
  });

  it('delegates toggle() to the language service', () => {
    component.toggle();
    expect(languageService.toggle).toHaveBeenCalled();
  });
});
