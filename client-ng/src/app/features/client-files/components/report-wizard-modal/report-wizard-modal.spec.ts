import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject } from 'rxjs';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { ReportWizardModal } from './report-wizard-modal';
import { InterventionReportsFacade } from '../../../intervention-reports/store/facade/intervention-reports.facade';
import { InterventionReportsActions } from '../../../intervention-reports/store/actions/intervention-reports.actions';
import type { InterventionReport } from '../../../../shared/models/intervention-report/intervention-report.model';

const makeReport = (overrides: Partial<InterventionReport> = {}): InterventionReport => ({
  _id: 'r1',
  clientFile: 'cf1',
  cashguardUnits: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

function buildComponent(): {
  component: ReportWizardModal;
  fixture: ReturnType<typeof TestBed.createComponent<ReportWizardModal>>;
  facade: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  actions$: Subject<Action>;
} {
  const facade = { create: vi.fn(), update: vi.fn() };
  const actions$ = new Subject<Action>();

  TestBed.overrideComponent(ReportWizardModal, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({
    imports: [ReportWizardModal],
    providers: [
      { provide: InterventionReportsFacade, useValue: facade },
      provideMockActions(() => actions$),
    ],
  });

  const fixture = TestBed.createComponent(ReportWizardModal);
  fixture.detectChanges();
  return { component: fixture.componentInstance, fixture, facade, actions$ };
}

describe('ReportWizardModal', () => {
  describe('isEdit', () => {
    it('is false without an existing report', () => {
      const { component } = buildComponent();
      expect(component.isEdit).toBe(false);
    });

    it('is true when an existing report is set', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput('existing', makeReport());
      fixture.detectChanges();
      expect(component.isEdit).toBe(true);
    });
  });

  describe('recap', () => {
    it('filters out blank registers and joins unit labels', () => {
      const { component } = buildComponent();
      component.twRegisters.set(['TW1', '', 'TW2']);
      component.twPc.set('PC1');
      component.units.set([
        { up: '111', ub: '', cassetteSlots: ['', '', '', ''], assignedRegisters: [], hasPc: false },
        { up: '', ub: '', cassetteSlots: ['', '', '', ''], assignedRegisters: [], hasPc: false },
      ]);

      expect(component.recap).toEqual({
        registers: ['TW1', 'TW2'],
        pc: 'PC1',
        unitCount: 2,
        unitNames: 'UP 111',
      });
    });
  });

  describe('ngOnChanges()', () => {
    it('resets to defaults when there is no existing report', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput('existing', makeReport());
      fixture.detectChanges();
      fixture.componentRef.setInput('existing', null);
      fixture.detectChanges();

      expect(component.twRegisters()).toEqual(['']);
      expect(component.twPc()).toBe('');
      expect(component.units()).toHaveLength(1);
      expect(component.notes()).toBe('');
    });

    it('loads twRegisters directly when present', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput(
        'existing',
        makeReport({ twRegisters: ['A', 'B'], notes: 'hello' }),
      );
      fixture.detectChanges();

      expect(component.twRegisters()).toEqual(['A', 'B']);
      expect(component.notes()).toBe('hello');
    });

    it('falls back to the legacy twRegister1/2/3 fields when twRegisters is absent', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput(
        'existing',
        makeReport({ twRegister1: 'R1', twRegister2: '', twRegister3: 'R3' }),
      );
      fixture.detectChanges();

      expect(component.twRegisters()).toEqual(['R1', 'R3']);
    });

    it('loads existing cashguard units, filling in any missing fields', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput(
        'existing',
        makeReport({
          cashguardUnits: [
            {
              up: '999',
              ub: '',
              cassetteSlots: ['', '', '', ''],
              assignedRegisters: [],
              hasPc: true,
            } as never,
          ],
        }),
      );
      fixture.detectChanges();

      expect(component.units()[0].up).toBe('999');
      expect(component.units()[0].hasPc).toBe(true);
    });
  });

  describe('addRegister() / removeRegister() / setRegister()', () => {
    it('adds an empty register', () => {
      const { component } = buildComponent();
      component.addRegister();
      expect(component.twRegisters()).toEqual(['', '']);
    });

    it('removes a register at the given index', () => {
      const { component } = buildComponent();
      component.twRegisters.set(['A', 'B', 'C']);
      component.removeRegister(1);
      expect(component.twRegisters()).toEqual(['A', 'C']);
    });

    it('sets the value of a register at the given index', () => {
      const { component } = buildComponent();
      component.twRegisters.set(['A', 'B']);
      component.setRegister(1, 'B-updated');
      expect(component.twRegisters()).toEqual(['A', 'B-updated']);
    });
  });

  describe('addUnit() / removeUnit() / toggleExpand()', () => {
    it('adds a unit and expands it', () => {
      const { component } = buildComponent();
      component.addUnit();
      expect(component.units()).toHaveLength(2);
      expect(component.expandedUnit()).toBe(1);
    });

    it('removes a unit at the given index', () => {
      const { component } = buildComponent();
      component.addUnit();
      component.removeUnit(0);
      expect(component.units()).toHaveLength(1);
    });

    it('toggleExpand collapses an already-expanded unit', () => {
      const { component } = buildComponent();
      component.toggleExpand(0);
      expect(component.expandedUnit()).toBe(-1);
    });

    it('toggleExpand expands a different unit', () => {
      const { component } = buildComponent();
      component.addUnit();
      component.toggleExpand(0);
      expect(component.expandedUnit()).toBe(0);
    });
  });

  describe('unitLabel()', () => {
    it('joins UP and UB when both are set', () => {
      const { component } = buildComponent();
      expect(
        component.unitLabel({
          up: '111',
          ub: '222',
          cassetteSlots: ['', '', '', ''],
          assignedRegisters: [],
          hasPc: false,
        }),
      ).toBe('UP 111 / UB 222');
    });

    it('returns just UP when UB is empty', () => {
      const { component } = buildComponent();
      expect(
        component.unitLabel({
          up: '111',
          ub: '',
          cassetteSlots: ['', '', '', ''],
          assignedRegisters: [],
          hasPc: false,
        }),
      ).toBe('UP 111');
    });
  });

  describe('setUnitField() / setK7() / setAssignedRegisters()', () => {
    it('setUnitField updates a single field of a unit', () => {
      const { component } = buildComponent();
      component.setUnitField(0, 'up', '555');
      expect(component.units()[0].up).toBe('555');
    });

    it('setK7 updates a single cassette slot without touching the others', () => {
      const { component } = buildComponent();
      component.setK7(0, 2, 'K7-C');
      expect(component.units()[0].cassetteSlots).toEqual(['', '', 'K7-C', '']);
    });

    it('setAssignedRegisters parses a comma-separated list, trimming and dropping blanks', () => {
      const { component } = buildComponent();
      component.setAssignedRegisters(0, 'A, B ,, C');
      expect(component.units()[0].assignedRegisters).toEqual(['A', 'B', 'C']);
    });
  });

  describe('submit()', () => {
    it('does nothing when already loading', () => {
      const { component, facade } = buildComponent();
      component.loading.set(true);
      component.submit();
      expect(facade.create).not.toHaveBeenCalled();
    });

    it('creates a new report and emits saved on success', () => {
      const { component, facade, actions$ } = buildComponent();
      const spy = vi.fn();
      component.saved.subscribe(spy);

      component.submit();
      expect(facade.create).toHaveBeenCalledWith(
        expect.objectContaining({ clientFile: '' }),
      );
      expect(component.loading()).toBe(true);

      actions$.next(
        InterventionReportsActions.createReportSuccess({ report: makeReport() }),
      );

      expect(component.loading()).toBe(false);
      expect(spy).toHaveBeenCalled();
    });

    it('does not emit saved when creation fails', () => {
      const { component, actions$ } = buildComponent();
      const spy = vi.fn();
      component.saved.subscribe(spy);

      component.submit();
      actions$.next(InterventionReportsActions.createReportFailure({ error: 'oops' }));

      expect(component.loading()).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it('updates an existing report and emits saved on success', () => {
      const { component, fixture, facade, actions$ } = buildComponent();
      fixture.componentRef.setInput('existing', makeReport({ _id: 'r42' }));
      fixture.detectChanges();

      const spy = vi.fn();
      component.saved.subscribe(spy);

      component.submit();
      expect(facade.update).toHaveBeenCalledWith('r42', expect.anything());

      actions$.next(
        InterventionReportsActions.updateReportSuccess({ report: makeReport({ _id: 'r42' }) }),
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
