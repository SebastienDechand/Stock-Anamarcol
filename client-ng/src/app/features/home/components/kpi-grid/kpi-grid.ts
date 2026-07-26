import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { KpiCard } from '../../../../shared/components/kpi-card/kpi-card';
import { GlobalStatistics } from '../../../../shared/models/statistics/statistics.model';

@Component({
  selector: 'app-kpi-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [KpiCard, TranslatePipe],
  templateUrl: './kpi-grid.html',
  styleUrl: './kpi-grid.scss',
})
export class KpiGrid {
  stats = input.required<GlobalStatistics>();
}
