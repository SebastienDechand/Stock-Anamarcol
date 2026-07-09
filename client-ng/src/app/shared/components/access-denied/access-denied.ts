import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ShieldOff } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, TranslatePipe],
  template: `
    <div class="access-denied">
      <lucide-icon name="shield-off" [size]="48" class="access-denied__icon" />
      <h2 class="access-denied__title">{{ 'ACCESS_DENIED.TITLE' | translate }}</h2>
      <p class="access-denied__msg">{{ 'ACCESS_DENIED.MESSAGE' | translate }}</p>
      <a routerLink="/home" class="access-denied__btn">{{ 'ACCESS_DENIED.BACK' | translate }}</a>
    </div>
  `,
  styleUrl: './access-denied.scss',
})
export class AccessDenied {
  readonly icons = { ShieldOff };
}
