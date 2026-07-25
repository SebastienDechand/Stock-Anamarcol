import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _dark = new BehaviorSubject<boolean>(this.getInitialDark());
  readonly isDark$ = this._dark.asObservable();

  constructor() {
    this.applyTheme(this._dark.value);
  }

  toggle(): void {
    const next = !this._dark.value;
    this._dark.next(next);
    this.applyTheme(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  private getInitialDark(): boolean {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
