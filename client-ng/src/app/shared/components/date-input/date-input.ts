import {
  Component,
  computed,
  signal,
  HostListener,
  ElementRef,
  inject,
  input,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-angular';
import { DatePickerRegistry } from './date-picker-registry.service';

interface DayCell {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

const MONTH_KEYS = [
  'CALENDAR.JAN',
  'CALENDAR.FEB',
  'CALENDAR.MAR',
  'CALENDAR.APR',
  'CALENDAR.MAY',
  'CALENDAR.JUN',
  'CALENDAR.JUL',
  'CALENDAR.AUG',
  'CALENDAR.SEP',
  'CALENDAR.OCT',
  'CALENDAR.NOV',
  'CALENDAR.DEC',
];

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './date-input.html',
  styleUrl: './date-input.scss',
})
export class DateInput {
  private readonly elementRef = inject(ElementRef);
  private readonly registry = inject(DatePickerRegistry);
  private readonly translate = inject(TranslateService);
  private readonly id = Symbol();

  value = model<string | undefined>('');
  placeholder = input('');
  disabled = input(false);

  readonly iconCalendar = Calendar;
  readonly iconLeft = ChevronLeft;
  readonly iconRight = ChevronRight;
  readonly iconX = X;

  readonly DAY_LABEL_KEYS = [
    'CALENDAR.MON',
    'CALENDAR.TUE',
    'CALENDAR.WED',
    'CALENDAR.THU',
    'CALENDAR.FRI',
    'CALENDAR.SAT',
    'CALENDAR.SUN',
  ];

  get effectivePlaceholder(): string {
    return this.placeholder() || this.translate.instant('COMMON.DATE_PLACEHOLDER');
  }

  isOpen = computed(() => this.registry.isActive(this.id));
  viewYear = signal(new Date().getFullYear());
  viewMonth = signal(new Date().getMonth());

  popupTop = signal('0px');
  popupLeft = signal('0px');
  popupMinWidth = signal('260px');

  get displayValue(): string {
    if (!this.value()) return '';
    const [year, month, day] = this.value()!.split('-');
    return `${day}/${month}/${year}`;
  }

  get monthLabel(): string {
    return `${this.translate.instant(MONTH_KEYS[this.viewMonth()])} ${this.viewYear()}`;
  }

  private get selectedDate(): Date | null {
    if (!this.value()) return null;
    const [year, month, day] = this.value()!.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  get days(): DayCell[] {
    const year = this.viewYear();
    const month = this.viewMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = this.selectedDate;

    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: DayCell[] = [];

    for (let i = firstDayOfWeek; i > 0; i--) {
      cells.push(this.makeCell(new Date(year, month, 1 - i), false, today, selectedDate));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(this.makeCell(new Date(year, month, day), true, today, selectedDate));
    }
    let nextMonthDay = 1;
    while (cells.length < 42) {
      cells.push(
        this.makeCell(new Date(year, month + 1, nextMonthDay++), false, today, selectedDate),
      );
    }
    return cells;
  }

  private makeCell(
    date: Date,
    isCurrent: boolean,
    today: Date,
    selectedDate: Date | null,
  ): DayCell {
    const isSelected = selectedDate
      ? date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate()
      : false;
    return {
      date,
      day: date.getDate(),
      isCurrentMonth: isCurrent,
      isToday: date.getTime() === today.getTime(),
      isSelected,
    };
  }

  close(): void {
    this.registry.close(this.id);
  }

  toggle(): void {
    if (this.disabled()) return;
    if (this.registry.isActive(this.id)) {
      this.registry.close(this.id);
    } else {
      if (this.value()) {
        const [year, month] = this.value()!.split('-').map(Number);
        this.viewYear.set(year);
        this.viewMonth.set(month - 1);
      } else {
        const now = new Date();
        this.viewYear.set(now.getFullYear());
        this.viewMonth.set(now.getMonth());
      }
      this.updatePosition();
      this.registry.open(this.id);
    }
  }

  private updatePosition(): void {
    const rect = (this.elementRef.nativeElement as HTMLElement).getBoundingClientRect();
    const popupHeight = 320;
    const top =
      window.innerHeight - rect.bottom >= popupHeight
        ? rect.bottom + 6
        : Math.max(6, rect.top - popupHeight - 6);

    this.popupTop.set(`${top}px`);
    this.popupLeft.set(`${rect.left}px`);
    this.popupMinWidth.set(`${Math.max(rect.width, 260)}px`);
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((m) => m + 1);
    }
  }

  selectDay(cell: DayCell): void {
    const date = cell.date;
    const iso = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    this.value.set(iso);
    this.registry.close(this.id);
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.value.set('');
    this.registry.close(this.id);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.registry.close(this.id);
  }
}
