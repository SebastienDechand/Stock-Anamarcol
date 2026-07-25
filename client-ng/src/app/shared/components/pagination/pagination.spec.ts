import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Pagination } from './pagination';

describe('Pagination', () => {
  beforeEach(() => {
    TestBed.overrideComponent(Pagination, { set: { template: '', imports: [] } });
    TestBed.configureTestingModule({ imports: [Pagination] });
  });

  function createComponent(current: number, total: number): Pagination {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('currentPage', current);
    fixture.componentRef.setInput('totalPages', total);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  describe('pages()', () => {
    it('lists every page when total is small enough that the window covers it all', () => {
      const component = createComponent(1, 3);
      expect(component.pages()).toEqual([1, 2, 3]);
    });

    it('truncates with an ellipsis once the total exceeds the window around current+first+last', () => {
      const component = createComponent(1, 5);
      expect(component.pages()).toEqual([1, 2, '...', 5]);
    });

    it('inserts an ellipsis between the first page and the window around the current page', () => {
      const component = createComponent(10, 20);
      expect(component.pages()).toEqual([1, '...', 9, 10, 11, '...', 20]);
    });

    it('has no leading ellipsis when the current page is near the start', () => {
      const component = createComponent(2, 20);
      expect(component.pages()).toEqual([1, 2, 3, '...', 20]);
    });

    it('has no trailing ellipsis when the current page is near the end', () => {
      const component = createComponent(19, 20);
      expect(component.pages()).toEqual([1, '...', 18, 19, 20]);
    });
  });

  describe('goTo()', () => {
    it('emits pageChange for a valid target page', () => {
      const component = createComponent(3, 10);
      const emitted: number[] = [];
      component.pageChange.subscribe((p) => emitted.push(p));

      component.goTo(5);

      expect(emitted).toEqual([5]);
    });

    it('does not emit for a page below 1', () => {
      const component = createComponent(3, 10);
      const emitted: number[] = [];
      component.pageChange.subscribe((p) => emitted.push(p));

      component.goTo(0);

      expect(emitted).toEqual([]);
    });

    it('does not emit for a page beyond totalPages', () => {
      const component = createComponent(3, 10);
      const emitted: number[] = [];
      component.pageChange.subscribe((p) => emitted.push(p));

      component.goTo(11);

      expect(emitted).toEqual([]);
    });

    it('does not emit when the target is already the current page', () => {
      const component = createComponent(3, 10);
      const emitted: number[] = [];
      component.pageChange.subscribe((p) => emitted.push(p));

      component.goTo(3);

      expect(emitted).toEqual([]);
    });
  });
});
