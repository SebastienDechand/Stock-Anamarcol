import {
  Component,
  DestroyRef,
  OnChanges,
  SimpleChanges,
  signal,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Wrench,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs';
import { InterventionReportsFacade } from '../../../intervention-reports/store/intervention-reports.facade';
import { InterventionReportsActions } from '../../../intervention-reports/store/intervention-reports.actions';
import {
  CashguardUnit,
  InterventionReport,
} from '../../../../shared/models/intervention-report.model';

function emptyUnit(): CashguardUnit {
  return {
    up: '',
    ub: '',
    cassetteSlots: ['', '', '', ''],
    assignedRegisters: [],
    hasPc: false,
  };
}

@Component({
  selector: 'app-report-wizard-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './report-wizard-modal.html',
  styleUrl: './report-wizard-modal.scss',
})
export class ReportWizardModal implements OnChanges {
  clientFileId = input('');
  clientLabel = input('');
  existing = input<InterventionReport | null>(null);
  saved = output<void>();
  closed = output<void>();

  private facade = inject(InterventionReportsFacade);
  private actions$ = inject(Actions);
  private destroyRef = inject(DestroyRef);

  readonly x = X;
  readonly wrench = Wrench;
  readonly fileText = FileText;
  readonly plus = Plus;
  readonly trash2 = Trash2;
  readonly chevDown = ChevronDown;
  readonly chevUp = ChevronUp;

  step = signal<1 | 2>(1);
  twRegisters = signal<string[]>(['']);
  twPc = signal('');
  units = signal<CashguardUnit[]>([emptyUnit()]);
  expandedUnit = signal(0);
  notes = signal('');
  loading = signal(false);

  readonly steps = [
    { n: 1, label: 'CLIENT_FILES.WIZARD_PREP' },
    { n: 2, label: 'CLIENT_FILES.WIZARD_NOTES_LABEL' },
  ];

  get isEdit(): boolean {
    return !!this.existing();
  }

  get recap(): { registers: string[]; pc: string; unitCount: number; unitNames: string } {
    return {
      registers: this.twRegisters().filter(Boolean),
      pc: this.twPc(),
      unitCount: this.units().length,
      unitNames: this.units()
        .filter((u) => u.up || u.ub)
        .map((u) => this.unitLabel(u))
        .join(', '),
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existing']) {
      const e = this.existing();
      this.step.set(1);
      if (e) {
        const registers = e.twRegisters?.length
          ? e.twRegisters
          : ([e.twRegister1, e.twRegister2, e.twRegister3].filter(Boolean) as string[]);
        this.twRegisters.set(registers.length ? registers : ['']);
        this.twPc.set(e.twPc ?? '');
        this.units.set(
          e.cashguardUnits?.length
            ? e.cashguardUnits.map((u) => ({ ...emptyUnit(), ...u }))
            : [emptyUnit()],
        );
        this.notes.set(e.notes ?? '');
      } else {
        this.twRegisters.set(['']);
        this.twPc.set('');
        this.units.set([emptyUnit()]);
        this.notes.set('');
      }
      this.expandedUnit.set(0);
    }
  }

  addRegister(): void {
    this.twRegisters.update((previous) => [...previous, '']);
  }

  removeRegister(index: number): void {
    this.twRegisters.update((previous) => previous.filter((_, i) => i !== index));
  }

  setRegister(index: number, value: string): void {
    this.twRegisters.update((previous) =>
      previous.map((register, i) => (i === index ? value : register)),
    );
  }

  addUnit(): void {
    this.units.update((previous) => [...previous, emptyUnit()]);
    this.expandedUnit.set(this.units().length - 1);
  }

  removeUnit(index: number): void {
    this.units.update((previous) => previous.filter((_, i) => i !== index));
  }

  toggleExpand(index: number): void {
    this.expandedUnit.update((current) => (current === index ? -1 : index));
  }

  unitLabel(unit: CashguardUnit): string {
    return [unit.up && `UP ${unit.up}`, unit.ub && `UB ${unit.ub}`].filter(Boolean).join(' / ');
  }

  setUnitField(index: number, field: keyof CashguardUnit, value: unknown): void {
    this.units.update((previous) =>
      previous.map((unit, i) => (i === index ? { ...unit, [field]: value } : unit)),
    );
  }

  setK7(unitIndex: number, slotIndex: number, value: string): void {
    this.units.update((previous) =>
      previous.map((unit, i) => {
        if (i !== unitIndex) return unit;
        const slots = [...unit.cassetteSlots] as [string, string, string, string];
        slots[slotIndex] = value;
        return { ...unit, cassetteSlots: slots };
      }),
    );
  }

  setAssignedRegisters(index: number, raw: string): void {
    const list = raw
      .split(',')
      .map((register) => register.trim())
      .filter(Boolean);
    this.setUnitField(index, 'assignedRegisters', list);
  }

  submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    const data = {
      clientFile: this.clientFileId(),
      twRegisters: this.twRegisters(),
      twPc: this.twPc(),
      cashguardUnits: this.units(),
      notes: this.notes(),
    };

    if (this.existing()) {
      this.actions$
        .pipe(
          ofType(
            InterventionReportsActions.updateReportSuccess,
            InterventionReportsActions.updateReportFailure,
          ),
          take(1),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((action) => {
          this.loading.set(false);
          if (action.type === InterventionReportsActions.updateReportSuccess.type)
            this.saved.emit();
        });
      this.facade.update(this.existing()!._id, data);
    } else {
      this.actions$
        .pipe(
          ofType(
            InterventionReportsActions.createReportSuccess,
            InterventionReportsActions.createReportFailure,
          ),
          take(1),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((action) => {
          this.loading.set(false);
          if (action.type === InterventionReportsActions.createReportSuccess.type)
            this.saved.emit();
        });
      this.facade.create(data);
    }
  }
}
