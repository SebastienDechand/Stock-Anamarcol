import { Component, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'brand';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span class="badge badge--{{ variant() }}"><ng-content /></span>`,
  styleUrl: './badge.scss',
})
export class Badge {
  variant = input<BadgeVariant>('brand');
}
