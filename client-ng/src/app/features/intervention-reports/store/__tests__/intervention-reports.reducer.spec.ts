import { describe, it, expect } from 'vitest';
import { interventionReportsReducer } from '../intervention-reports.reducer';
import { InterventionReportsActions } from '../intervention-reports.actions';
import { initialInterventionReportsState } from '../intervention-reports.state';
import type { InterventionReport } from '../../../../shared/models/intervention-report.model';

const sampleReport: InterventionReport = {
  _id: 'r1',
  clientFile: 'f1',
  cashguardUnits: [
    {
      up: 'UP-001',
      k7Slots: ['', '', '', ''],
      assignedCaisses: ['caisse1'],
      hasPc: true,
    },
  ],
  twCaisse1: 'TW-001',
  notes: 'RAS',
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
};

const otherReport: InterventionReport = {
  _id: 'r2',
  clientFile: 'f2',
  cashguardUnits: [],
  notes: 'Intervention terminée',
  createdAt: '2024-02-15T00:00:00Z',
  updatedAt: '2024-02-15T00:00:00Z',
};

describe('interventionReportsReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = interventionReportsReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialInterventionReportsState);
  });

  it('should handle loadAll by setting isLoading to true', () => {
    const state = interventionReportsReducer(
      initialInterventionReportsState,
      InterventionReportsActions.loadAll(),
    );
    expect(state.isLoading).toBe(true);
  });

  it('should handle loadAllSuccess', () => {
    const state = interventionReportsReducer(
      { ...initialInterventionReportsState, isLoading: true },
      InterventionReportsActions.loadAllSuccess({ reports: [sampleReport, otherReport] }),
    );
    expect(state.reports).toEqual([sampleReport, otherReport]);
    expect(state.loaded).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle loadAllFailure', () => {
    const state = interventionReportsReducer(
      { ...initialInterventionReportsState, isLoading: true },
      InterventionReportsActions.loadAllFailure({ error: 'Erreur chargement' }),
    );
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Erreur chargement');
  });

  it('should handle loadByClientFileSuccess by replacing reports list and clearing isLoading', () => {
    const state = interventionReportsReducer(
      { ...initialInterventionReportsState, reports: [otherReport], isLoading: true },
      InterventionReportsActions.loadByClientFileSuccess({ reports: [sampleReport] }),
    );
    expect(state.reports).toEqual([sampleReport]);
    expect(state.isLoading).toBe(false);
  });

  it('should handle loadOneSuccess by setting selectedReport and updating list if present', () => {
    const updated: InterventionReport = { ...sampleReport, notes: 'Mise à jour notes' };
    const state = interventionReportsReducer(
      { ...initialInterventionReportsState, reports: [sampleReport, otherReport] },
      InterventionReportsActions.loadOneSuccess({ report: updated }),
    );
    expect(state.selectedReport).toEqual(updated);
    expect(state.reports.find((r) => r._id === 'r1')).toEqual(updated);
  });

  it('should handle loadOneSuccess by appending to list if not present', () => {
    const state = interventionReportsReducer(
      { ...initialInterventionReportsState, reports: [otherReport] },
      InterventionReportsActions.loadOneSuccess({ report: sampleReport }),
    );
    expect(state.reports).toHaveLength(2);
    expect(state.reports).toContain(sampleReport);
  });

  it('should handle createReportSuccess by appending to reports', () => {
    const state = interventionReportsReducer(
      { ...initialInterventionReportsState, reports: [otherReport] },
      InterventionReportsActions.createReportSuccess({ report: sampleReport }),
    );
    expect(state.reports).toEqual([otherReport, sampleReport]);
  });

  it('should handle updateReportSuccess by replacing report in list', () => {
    const updated: InterventionReport = { ...sampleReport, notes: 'Modifié' };
    const state = interventionReportsReducer(
      { ...initialInterventionReportsState, reports: [sampleReport, otherReport] },
      InterventionReportsActions.updateReportSuccess({ report: updated }),
    );
    expect(state.reports.find((r) => r._id === 'r1')).toEqual(updated);
    expect(state.reports.find((r) => r._id === 'r2')).toEqual(otherReport);
  });

  it('should handle updateReportSuccess by updating selectedReport when it matches', () => {
    const updated: InterventionReport = { ...sampleReport, notes: 'Modifié' };
    const state = interventionReportsReducer(
      {
        ...initialInterventionReportsState,
        reports: [sampleReport],
        selectedReport: sampleReport,
      },
      InterventionReportsActions.updateReportSuccess({ report: updated }),
    );
    expect(state.selectedReport).toEqual(updated);
  });

  it('should handle updateReportSuccess without changing selectedReport when it does not match', () => {
    const updated: InterventionReport = { ...sampleReport, notes: 'Modifié' };
    const state = interventionReportsReducer(
      {
        ...initialInterventionReportsState,
        reports: [sampleReport, otherReport],
        selectedReport: otherReport,
      },
      InterventionReportsActions.updateReportSuccess({ report: updated }),
    );
    expect(state.selectedReport).toEqual(otherReport);
  });

  it('should handle deleteReportSuccess by removing the report from the list', () => {
    const state = interventionReportsReducer(
      { ...initialInterventionReportsState, reports: [sampleReport, otherReport] },
      InterventionReportsActions.deleteReportSuccess({ id: 'r1' }),
    );
    expect(state.reports).toEqual([otherReport]);
  });

  it('should handle deleteReportSuccess by clearing selectedReport when it matches', () => {
    const state = interventionReportsReducer(
      {
        ...initialInterventionReportsState,
        reports: [sampleReport, otherReport],
        selectedReport: sampleReport,
      },
      InterventionReportsActions.deleteReportSuccess({ id: 'r1' }),
    );
    expect(state.selectedReport).toBeNull();
  });

  it('should handle deleteReportSuccess without clearing selectedReport when it does not match', () => {
    const state = interventionReportsReducer(
      {
        ...initialInterventionReportsState,
        reports: [sampleReport, otherReport],
        selectedReport: otherReport,
      },
      InterventionReportsActions.deleteReportSuccess({ id: 'r1' }),
    );
    expect(state.selectedReport).toEqual(otherReport);
  });

  it('should handle setSelected by updating selectedReport', () => {
    const state = interventionReportsReducer(
      initialInterventionReportsState,
      InterventionReportsActions.setSelected({ report: sampleReport }),
    );
    expect(state.selectedReport).toEqual(sampleReport);
  });

  it('should handle setSelected with null by clearing selectedReport', () => {
    const state = interventionReportsReducer(
      { ...initialInterventionReportsState, selectedReport: sampleReport },
      InterventionReportsActions.setSelected({ report: null }),
    );
    expect(state.selectedReport).toBeNull();
  });
});
