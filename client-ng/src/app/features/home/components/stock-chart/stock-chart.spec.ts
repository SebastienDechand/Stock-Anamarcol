import { TestBed } from '@angular/core/testing';
import { QueryList } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockChart } from './stock-chart';
import { TranslateService } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import type { SupplierStats } from '../../../../shared/models/statistics/statistics.model';

// jsdom doesn't implement ResizeObserver.
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const makeStat = (overrides: Partial<SupplierStats> = {}): SupplierStats => ({
  numberOfArticles: 1,
  totalStock: 10,
  numberOfLowStockArticles: 0,
  name: 'Alpha',
  ...overrides,
});

function buildComponent(stats: SupplierStats[]) {
  const translate = { instant: vi.fn((key: string) => key) };
  TestBed.overrideComponent(StockChart, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({
    imports: [StockChart],
    providers: [{ provide: TranslateService, useValue: translate }],
  });
  const fixture = TestBed.createComponent(StockChart);
  fixture.componentRef.setInput('stats', stats);
  fixture.detectChanges();
  return { component: fixture.componentInstance, translate };
}

describe('StockChart', () => {
  describe('palette', () => {
    it('assigns one colour per supplier', () => {
      const { component } = buildComponent([makeStat(), makeStat()]);
      expect(component.palette).toHaveLength(2);
      expect(component.palette[0]).not.toBe(component.palette[1]);
    });

    it('cycles the palette once there are more suppliers than colours', () => {
      const { component } = buildComponent(Array.from({ length: 11 }, () => makeStat()));
      expect(component.palette[0]).toBe(component.palette[10]);
    });
  });

  describe('ngOnChanges()', () => {
    it('builds pie and bar data from the given stats', () => {
      const { component } = buildComponent([
        makeStat({ name: 'Alpha', totalStock: 10 }),
        makeStat({ name: 'Beta', totalStock: 20 }),
      ]);

      expect(component.pieData.labels).toEqual(['Alpha', 'Beta']);
      expect(component.pieData.datasets[0].data).toEqual([10, 20]);
      expect(component.barData.labels).toEqual(['Alpha', 'Beta']);
      expect(component.barData.datasets[0].data).toEqual([10, 20]);
    });

    it('falls back to the "unknown" translation when a supplier has no name', () => {
      const { component, translate } = buildComponent([makeStat({ name: undefined })]);
      expect(component.pieData.labels).toEqual(['HOME.UNKNOWN']);
      expect(translate.instant).toHaveBeenCalledWith('HOME.UNKNOWN');
    });
  });

  describe('pieOptions tooltip label callback', () => {
    it('formats the label using the translated unit count', () => {
      const { component } = buildComponent([makeStat()]);
      const label = component.pieOptions.plugins?.tooltip?.callbacks?.label;
      const formatted = label?.call({} as never, { label: 'Alpha', parsed: 10 } as never);
      expect(formatted).toBe(' Alpha: HOME.CHART_UNITS');
    });
  });

  describe('ngAfterViewChecked()', () => {
    it('resizes charts once after a change, then does nothing until the next change', () => {
      const { component } = buildComponent([makeStat()]);
      const resize = vi.fn();
      const chartDirective = { chart: { resize } } as unknown as BaseChartDirective;
      const list = new QueryList<BaseChartDirective>();
      list.reset([chartDirective]);
      component.charts = list;

      component.ngAfterViewChecked();
      expect(resize).not.toHaveBeenCalled();

      component.ngOnChanges();
      component.ngAfterViewChecked();
      expect(resize).toHaveBeenCalledTimes(1);

      component.ngAfterViewChecked();
      expect(resize).toHaveBeenCalledTimes(1);
    });
  });
});
