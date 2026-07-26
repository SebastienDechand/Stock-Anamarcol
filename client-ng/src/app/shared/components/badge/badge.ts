import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeVariant =
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'cyan'
  | 'purple'
  | 'gray'
  | 'yellow';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `<span class="badge badge--{{ variant() }}"><ng-content /></span>`,
  styleUrl: './badge.scss',
})
export class Badge {
  variant = input.required<BadgeVariant>();
}
