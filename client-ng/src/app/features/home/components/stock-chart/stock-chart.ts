import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnChanges,
  OnDestroy,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
} from 'chart.js';
import { SupplierStats } from '../../../../shared/models/statistics/statistics.model';

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
);

const PALETTE = [
  '#16a34a',
  '#2563eb',
  '#d97706',
  '#9333ea',
  '#dc2626',
  '#0891b2',
  '#be185d',
  '#65a30d',
  '#ea580c',
  '#4f46e5',
];

@Component({
  selector: 'app-stock-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [BaseChartDirective, TranslatePipe],
  templateUrl: './stock-chart.html',
  styleUrl: './stock-chart.scss',
})
export class StockChart implements OnChanges, AfterViewChecked, AfterViewInit, OnDestroy {
  stats = input.required<SupplierStats[]>();
  chartType = input<'pie' | 'bar'>('pie');

  private readonly translate = inject(TranslateService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;
  private needsResize = false;
  private resizeObserver?: ResizeObserver;

  pieData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  barData: ChartData<'bar'> = { labels: [], datasets: [] };

  pieOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}: ${this.translate.instant('HOME.CHART_UNITS', { count: ctx.parsed })}`,
        },
      },
    },
  };

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  get palette() {
    return this.stats().map((_, index) => PALETTE[index % PALETTE.length]);
  }

  ngAfterViewChecked() {
    if (this.needsResize) {
      this.needsResize = false;
      this.charts.forEach((chart) => chart.chart?.resize());
    }
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => {
      this.charts.forEach((chart) => chart.chart?.resize());
    });
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  ngOnChanges() {
    this.needsResize = true;
    const labels = this.stats().map((stat) => stat.name ?? this.translate.instant('HOME.UNKNOWN'));
    const data = this.stats().map((stat) => stat.totalStock);
    const colors = this.palette;

    this.pieData = {
      labels,
      datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }],
    };
    this.barData = {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
    };
  }
}
