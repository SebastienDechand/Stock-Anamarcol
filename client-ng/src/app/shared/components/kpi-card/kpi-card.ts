import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type KpiAccent = 'brand' | 'blue' | 'amber' | 'red' | 'violet' | 'green';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number | string;
  @Input() icon = 'bar-chart';
  @Input() accent: KpiAccent = 'brand';
  @Input() subtitle = '';
}
