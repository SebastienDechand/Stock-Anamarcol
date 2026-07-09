import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { KpiCard } from '../../../../shared/components/kpi-card/kpi-card';
import { GlobalStatistics } from '../../../../shared/models/statistics.model';

@Component({
  selector: 'app-kpi-grid',
  standalone: true,
  imports: [KpiCard, TranslatePipe],
  templateUrl: './kpi-grid.html',
  styleUrl: './kpi-grid.scss',
})
export class KpiGrid {
  @Input({ required: true }) stats!: GlobalStatistics;
}
