import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language/language.service';

export type LanguageToggleVariant = 'icon' | 'menu-item';

@Component({
  selector: 'app-language-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, TranslatePipe],
  templateUrl: './language-toggle.html',
  styleUrl: './language-toggle.scss',
})
export class LanguageToggle {
  private languageService = inject(LanguageService);

  variant = input<LanguageToggleVariant>('icon');

  lang$ = this.languageService.lang$;

  toggle(): void {
    this.languageService.toggle();
  }
}
