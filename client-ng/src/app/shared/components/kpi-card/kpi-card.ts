import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type KpiAccent = 'brand' | 'blue' | 'amber' | 'red' | 'violet' | 'green';

@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  label = input.required<string>();
  value = input.required<number | string>();
  icon = input('bar-chart');
  accent = input<KpiAccent>('brand');
  subtitle = input('');
}
