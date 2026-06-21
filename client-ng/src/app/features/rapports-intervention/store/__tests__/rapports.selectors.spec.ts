import { describe, it, expect } from 'vitest';
import {
  selectAllRapports,
  selectSelectedRapport,
  selectRapportsLoading,
  selectRapportsLoaded,
} from '../rapports.selectors';
import { initialRapportsState } from '../rapports.state';
import type { InterventionReport } from '../../../../shared/models/intervention-report.model';

const sampleRapport: InterventionReport = {
  _id: 'rap-1',
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

const sampleRapport2: InterventionReport = {
  _id: 'rap-2',
  clientFile: { _id: 'cf-2', nom: 'Martin', ville: 'Lyon', cp: '69001' },
  cashguardUnits: [],
  notes: 'Mise à jour logiciel',
  createdAt: '2024-03-15T09:00:00Z',
  updatedAt: '2024-03-15T11:00:00Z',
};

describe('Rapports Selectors', () => {
  describe('selectAllRapports', () => {
    it('should return empty array from initial state', () => {
      const state = { rapports: initialRapportsState };
      expect(selectAllRapports(state)).toEqual([]);
    });

    it('should return rapports when populated', () => {
      const state = {
        rapports: { ...initialRapportsState, rapports: [sampleRapport, sampleRapport2] },
      };
      expect(selectAllRapports(state)).toEqual([sampleRapport, sampleRapport2]);
    });
  });

  describe('selectSelectedRapport', () => {
    it('should return null from initial state', () => {
      const state = { rapports: initialRapportsState };
      expect(selectSelectedRapport(state)).toBeNull();
    });

    it('should return the selected rapport when set', () => {
      const state = {
        rapports: { ...initialRapportsState, selectedRapport: sampleRapport },
      };
      expect(selectSelectedRapport(state)).toEqual(sampleRapport);
    });
  });

  describe('selectRapportsLoading', () => {
    it('should return false from initial state', () => {
      const state = { rapports: initialRapportsState };
      expect(selectRapportsLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = { rapports: { ...initialRapportsState, isLoading: true } };
      expect(selectRapportsLoading(state)).toBe(true);
    });
  });

  describe('selectRapportsLoaded', () => {
    it('should return false from initial state', () => {
      const state = { rapports: initialRapportsState };
      expect(selectRapportsLoaded(state)).toBe(false);
    });

    it('should return true when loaded', () => {
      const state = { rapports: { ...initialRapportsState, loaded: true } };
      expect(selectRapportsLoaded(state)).toBe(true);
    });
  });
});
