import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, User, LogOut, Menu, Moon, Sun } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade } from '../../../store/auth/auth.facade';
import { UiFacade } from '../../../store/ui/ui.facade';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [AsyncPipe, RouterLink, LucideAngularModule, TranslatePipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected authFacade = inject(AuthFacade);
  protected uiFacade = inject(UiFacade);
  readonly themeService = inject(ThemeService);
  readonly languageService = inject(LanguageService);

  readonly icons = { User, LogOut, Menu, Moon, Sun };
  readonly apiUrl = environment.apiUrl;
  readonly menuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }

  getAvatarUrl(picture?: string): string {
    if (!picture) return '';
    if (picture.startsWith('http')) return picture;
    return `${this.apiUrl}${picture}`;
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleLanguage(): void {
    this.languageService.toggle();
    this.closeMenu();
  }

  toggleTheme(): void {
    this.themeService.toggle();
    this.closeMenu();
  }

  logout(): void {
    this.authFacade.logout();
    this.closeMenu();
  }
}
