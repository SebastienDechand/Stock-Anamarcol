import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'fr' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly _lang = new BehaviorSubject<Lang>(this.getInitialLang());
  readonly lang$ = this._lang.asObservable();

  constructor(private translate: TranslateService) {
    translate.addLangs(['fr', 'en']);
    translate.use(this._lang.value);
  }

  get current(): Lang {
    return this._lang.value;
  }

  toggle(): void {
    this.set(this._lang.value === 'fr' ? 'en' : 'fr');
  }

  set(lang: Lang): void {
    this._lang.next(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }

  private getInitialLang(): Lang {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'fr' || saved === 'en') return saved;
    const browser = navigator.language.slice(0, 2);
    return browser === 'en' ? 'en' : 'fr';
  }
}
