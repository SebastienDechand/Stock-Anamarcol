import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { HomePage } from './home-page';
import { StatisticsFacade } from './store/facade/statistics.facade';
import { initialStatisticsState } from './store/state/statistics.state';

const initialState = { statistics: initialStatisticsState };

describe('HomePage', () => {
  let component: HomePage;
  let facade: StatisticsFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(HomePage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    facade = TestBed.inject(StatisticsFacade);
    vi.spyOn(facade, 'loadDashboard').mockImplementation(() => {});

    const fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadDashboard on init', () => {
    expect(facade.loadDashboard).toHaveBeenCalledOnce();
  });

  describe('toggleChart()', () => {
    it('should set chartType to bar', () => {
      component.toggleChart('bar');
      expect(component.chartType()).toBe('bar');
    });

    it('should set chartType back to pie', () => {
      component.toggleChart('bar');
      component.toggleChart('pie');
      expect(component.chartType()).toBe('pie');
    });
  });
});
