import { describe, it, expect } from 'vitest';
import {
  selectAllInterventionReports,
  selectSelectedInterventionReport,
  selectInterventionReportsLoading,
  selectInterventionReportsLoaded,
} from '../intervention-reports.selectors';
import { initialInterventionReportsState } from '../intervention-reports.state';
import type { InterventionReport } from '../../../../shared/models/intervention-report.model';

const sampleReport: InterventionReport = {
  _id: 'rep-1',
  clientFile: 'cf-1',
  cashguardUnits: [
    {
      up: 'UP1',
      ub: 'UB1',
      k7Slots: ['', '', '', ''],
      assignedCaisses: ['caisse-1'],
      hasPc: true,
    },
  ],
  notes: 'Intervention initiale',
  createdAt: '2024-02-01T08:00:00Z',
  updatedAt: '2024-02-01T10:00:00Z',
};

const sampleReport2: InterventionReport = {
  _id: 'rep-2',
  clientFile: { _id: 'cf-2', lastName: 'Martin', city: 'Lyon', postalCode: '69001' },
  cashguardUnits: [],
  notes: 'Mise à jour logiciel',
  createdAt: '2024-03-15T09:00:00Z',
  updatedAt: '2024-03-15T11:00:00Z',
};

describe('Intervention Reports Selectors', () => {
  describe('selectAllInterventionReports', () => {
    it('should return empty array from initial state', () => {
      const state = { interventionReports: initialInterventionReportsState };
      expect(selectAllInterventionReports(state)).toEqual([]);
    });

    it('should return reports when populated', () => {
      const state = {
        interventionReports: {
          ...initialInterventionReportsState,
          reports: [sampleReport, sampleReport2],
        },
      };
      expect(selectAllInterventionReports(state)).toEqual([sampleReport, sampleReport2]);
    });
  });

  describe('selectSelectedInterventionReport', () => {
    it('should return null from initial state', () => {
      const state = { interventionReports: initialInterventionReportsState };
      expect(selectSelectedInterventionReport(state)).toBeNull();
    });

    it('should return the selected report when set', () => {
      const state = {
        interventionReports: {
          ...initialInterventionReportsState,
          selectedReport: sampleReport,
        },
      };
      expect(selectSelectedInterventionReport(state)).toEqual(sampleReport);
    });
  });

  describe('selectInterventionReportsLoading', () => {
    it('should return false from initial state', () => {
      const state = { interventionReports: initialInterventionReportsState };
      expect(selectInterventionReportsLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = {
        interventionReports: { ...initialInterventionReportsState, isLoading: true },
      };
      expect(selectInterventionReportsLoading(state)).toBe(true);
    });
  });

  describe('selectInterventionReportsLoaded', () => {
    it('should return false from initial state', () => {
      const state = { interventionReports: initialInterventionReportsState };
      expect(selectInterventionReportsLoaded(state)).toBe(false);
    });

    it('should return true when loaded', () => {
      const state = {
        interventionReports: { ...initialInterventionReportsState, loaded: true },
      };
      expect(selectInterventionReportsLoaded(state)).toBe(true);
    });
  });
});
