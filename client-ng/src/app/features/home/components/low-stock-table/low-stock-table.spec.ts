import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LowStockTable } from './low-stock-table';
import type { LowStockItem } from '../../../../shared/models/statistics/statistics.model';

const items: LowStockItem[] = [
  { _id: '1', name: 'Joint', supplier: 'Alpha', status: 'SAV', quantity: 1 },
  { _id: '2', name: 'Cassette', supplier: 'Beta', status: 'Neuf', quantity: 2 },
  { _id: '3', name: 'Carte', supplier: 'Gamma', status: 'SAV', quantity: 0 },
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

    it('returns only SAV items when the active tab is "SAV"', () => {
      component.activeTab.set('SAV');
      expect(component.filteredItems.map((i) => i._id)).toEqual(['1', '3']);
    });

    it('returns only Neuf items when the active tab is "Neuf"', () => {
      component.activeTab.set('Neuf');
      expect(component.filteredItems.map((i) => i._id)).toEqual(['2']);
    });
  });

  describe('countByTab()', () => {
    it('counts every item for "all"', () => {
      expect(component.countByTab('all')).toBe(3);
    });

    it('counts only matching items for "SAV"', () => {
      expect(component.countByTab('SAV')).toBe(2);
    });

    it('counts only matching items for "Neuf"', () => {
      expect(component.countByTab('Neuf')).toBe(1);
    });
  });
});
