import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TranslateService } from '@ngx-translate/core';
import { DateInput } from './date-input';

describe('DateInput', () => {
  let component: DateInput;
  let fixture: ComponentFixture<DateInput>;

  beforeEach(async () => {
    TestBed.overrideComponent(DateInput, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [DateInput],
      providers: [{ provide: TranslateService, useValue: { instant: (key: string) => key } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DateInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('displayValue', () => {
    it('returns an empty string when there is no value', () => {
      component.value.set('');
      expect(component.displayValue).toBe('');
    });

    it('formats an ISO value as dd/mm/yyyy', () => {
      component.value.set('2026-03-05');
      expect(component.displayValue).toBe('05/03/2026');
    });
  });

  describe('monthLabel', () => {
    it('combines the translated month name with the view year', () => {
      component.viewYear.set(2026);
      component.viewMonth.set(2);
      expect(component.monthLabel).toBe('CALENDAR.MAR 2026');
    });
  });

  describe('days', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
    });

    it('produces exactly 6 weeks (42 cells)', () => {
      component.viewYear.set(2026);
      component.viewMonth.set(2);
      expect(component.days).toHaveLength(42);
    });

    it('flags the day matching today as isToday', () => {
      component.viewYear.set(2026);
      component.viewMonth.set(2);
      const todayCell = component.days.find((cell) => cell.isToday);
      expect(todayCell?.day).toBe(15);
      expect(todayCell?.isCurrentMonth).toBe(true);
    });

    it('flags the day matching the current value as isSelected', () => {
      component.value.set('2026-03-20');
      component.viewYear.set(2026);
      component.viewMonth.set(2);
      const selectedCells = component.days.filter((cell) => cell.isSelected);
      expect(selectedCells).toHaveLength(1);
      expect(selectedCells[0].day).toBe(20);
    });

    it('marks days spilling over from adjacent months as not isCurrentMonth', () => {
      component.viewYear.set(2026);
      component.viewMonth.set(2);
      const spillover = component.days.filter((cell) => !cell.isCurrentMonth);
      expect(spillover.length).toBeGreaterThan(0);
    });
  });

  describe('toggle()', () => {
    it('does nothing when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      component.toggle();
      expect(component.isOpen()).toBe(false);
    });

    it('opens the picker on the current month when there is no value', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-10T12:00:00.000Z'));
      component.value.set('');
      component.toggle();
      expect(component.viewYear()).toBe(2026);
      expect(component.viewMonth()).toBe(6);
      expect(component.isOpen()).toBe(true);
    });

    it('opens the picker on the value month when a value is set', () => {
      component.value.set('2025-11-20');
      component.toggle();
      expect(component.viewYear()).toBe(2025);
      expect(component.viewMonth()).toBe(10);
      expect(component.isOpen()).toBe(true);
    });

    it('closes the picker when it is already open', () => {
      component.toggle();
      expect(component.isOpen()).toBe(true);
      component.toggle();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('prevMonth() / nextMonth()', () => {
    it('moves to the previous month within the same year', () => {
      component.viewYear.set(2026);
      component.viewMonth.set(5);
      component.prevMonth();
      expect(component.viewYear()).toBe(2026);
      expect(component.viewMonth()).toBe(4);
    });

    it('wraps to December of the previous year from January', () => {
      component.viewYear.set(2026);
      component.viewMonth.set(0);
      component.prevMonth();
      expect(component.viewYear()).toBe(2025);
      expect(component.viewMonth()).toBe(11);
    });

    it('moves to the next month within the same year', () => {
      component.viewYear.set(2026);
      component.viewMonth.set(5);
      component.nextMonth();
      expect(component.viewYear()).toBe(2026);
      expect(component.viewMonth()).toBe(6);
    });

    it('wraps to January of the next year from December', () => {
      component.viewYear.set(2026);
      component.viewMonth.set(11);
      component.nextMonth();
      expect(component.viewYear()).toBe(2027);
      expect(component.viewMonth()).toBe(0);
    });
  });

  describe('selectDay()', () => {
    it('sets the value as an ISO date and closes the picker', () => {
      component.toggle();
      component.selectDay({
        date: new Date(2026, 2, 7),
        day: 7,
        isCurrentMonth: true,
        isToday: false,
        isSelected: false,
      });
      expect(component.value()).toBe('2026-03-07');
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('clears the value, stops propagation and closes the picker', () => {
      component.value.set('2026-03-07');
      component.toggle();
      const event = { stopPropagation: vi.fn() } as unknown as Event;
      component.clear(event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.value()).toBe('');
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('onEsc()', () => {
    it('closes the picker', () => {
      component.toggle();
      expect(component.isOpen()).toBe(true);
      component.onEsc();
      expect(component.isOpen()).toBe(false);
    });
  });
});
