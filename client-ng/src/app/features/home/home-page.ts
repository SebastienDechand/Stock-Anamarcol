import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { StatisticsFacade } from './store/facade/statistics.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { KpiGrid } from './components/kpi-grid/kpi-grid';
import { StockChart } from './components/stock-chart/stock-chart';
import { LowStockTable } from './components/low-stock-table/low-stock-table';
import { PageHero } from '../../shared/components/page-hero/page-hero';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    LucideAngularModule,
    TranslatePipe,
    Spinner,
    KpiGrid,
    StockChart,
    LowStockTable,
    PageHero,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  protected facade = inject(StatisticsFacade);

  chartType = signal<'pie' | 'bar'>('pie');

  ngOnInit() {
    this.facade.loadDashboard();
  }

  toggleChart(type: 'pie' | 'bar') {
    this.chartType.set(type);
  }
}
