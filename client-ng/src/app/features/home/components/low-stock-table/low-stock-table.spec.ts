import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LowStockTable } from './low-stock-table';
import type { LowStockItem } from '../../../../shared/models/statistics/statistics.model';

const items: LowStockItem[] = [
  { _id: '1', name: 'Joint', supplier: 'Alpha', status: 'RMA', quantity: 1 },
  { _id: '2', name: 'Cassette', supplier: 'Beta', status: 'NEW', quantity: 2 },
  { _id: '3', name: 'Carte', supplier: 'Gamma', status: 'RMA', quantity: 0 },
];

describe('LowStockTable', () => {
  let component: LowStockTable;

  beforeEach(async () => {
    TestBed.overrideComponent(LowStockTable, { set: { template: '', imports: [] } });
    await TestBed.configureTestingModule({ imports: [LowStockTable] }).compileComponents();

    const fixture = TestBed.createComponent(LowStockTable);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  });

  describe('filteredItems', () => {
    it('returns every item when the active tab is "all"', () => {
      expect(component.filteredItems).toHaveLength(3);
    });

    it('returns only RMA items when the active tab is "RMA"', () => {
      component.activeTab.set('RMA');
      expect(component.filteredItems.map((i) => i._id)).toEqual(['1', '3']);
    });

    it('returns only NEW items when the active tab is "NEW"', () => {
      component.activeTab.set('NEW');
      expect(component.filteredItems.map((i) => i._id)).toEqual(['2']);
    });
  });

  describe('countByTab()', () => {
    it('counts every item for "all"', () => {
      expect(component.countByTab('all')).toBe(3);
    });

    it('counts only matching items for "RMA"', () => {
      expect(component.countByTab('RMA')).toBe(2);
    });

    it('counts only matching items for "NEW"', () => {
      expect(component.countByTab('NEW')).toBe(1);
    });
  });
});
