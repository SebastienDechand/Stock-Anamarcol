import { describe, it, expect } from 'vitest';
import { rapportsReducer } from '../rapports.reducer';
import { RapportsActions } from '../rapports.actions';
import { initialRapportsState } from '../rapports.state';
import type { InterventionReport } from '../../../../shared/models/intervention-report.model';

const sampleRapport: InterventionReport = {
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

const otherRapport: InterventionReport = {
  _id: 'r2',
  clientFile: 'f2',
  cashguardUnits: [],
  notes: 'Intervention terminée',
  createdAt: '2024-02-15T00:00:00Z',
  updatedAt: '2024-02-15T00:00:00Z',
};

describe('rapportsReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = rapportsReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialRapportsState);
  });

  it('should handle loadAll by setting isLoading to true', () => {
    const state = rapportsReducer(initialRapportsState, RapportsActions.loadAll());
    expect(state.isLoading).toBe(true);
  });

  it('should handle loadAllSuccess', () => {
    const state = rapportsReducer(
      { ...initialRapportsState, isLoading: true },
      RapportsActions.loadAllSuccess({ rapports: [sampleRapport, otherRapport] }),
    );
    expect(state.rapports).toEqual([sampleRapport, otherRapport]);
    expect(state.loaded).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle loadAllFailure', () => {
    const state = rapportsReducer(
      { ...initialRapportsState, isLoading: true },
      RapportsActions.loadAllFailure({ error: 'Erreur chargement' }),
    );
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Erreur chargement');
  });

  it('should handle loadByClientFileSuccess by replacing rapports list and clearing isLoading', () => {
    const state = rapportsReducer(
      { ...initialRapportsState, rapports: [otherRapport], isLoading: true },
      RapportsActions.loadByClientFileSuccess({ rapports: [sampleRapport] }),
    );
    expect(state.rapports).toEqual([sampleRapport]);
    expect(state.isLoading).toBe(false);
  });

  it('should handle loadOneSuccess by setting selectedRapport and updating list if present', () => {
    const updated: InterventionReport = { ...sampleRapport, notes: 'Mise à jour notes' };
    const state = rapportsReducer(
      { ...initialRapportsState, rapports: [sampleRapport, otherRapport] },
      RapportsActions.loadOneSuccess({ rapport: updated }),
    );
    expect(state.selectedRapport).toEqual(updated);
    expect(state.rapports.find((r) => r._id === 'r1')).toEqual(updated);
  });

  it('should handle loadOneSuccess by appending to list if not present', () => {
    const state = rapportsReducer(
      { ...initialRapportsState, rapports: [otherRapport] },
      RapportsActions.loadOneSuccess({ rapport: sampleRapport }),
    );
    expect(state.rapports).toHaveLength(2);
    expect(state.rapports).toContain(sampleRapport);
  });

  it('should handle createRapportSuccess by appending to rapports', () => {
    const state = rapportsReducer(
      { ...initialRapportsState, rapports: [otherRapport] },
      RapportsActions.createRapportSuccess({ rapport: sampleRapport }),
    );
    expect(state.rapports).toEqual([otherRapport, sampleRapport]);
  });

  it('should handle updateRapportSuccess by replacing rapport in list', () => {
    const updated: InterventionReport = { ...sampleRapport, notes: 'Modifié' };
    const state = rapportsReducer(
      { ...initialRapportsState, rapports: [sampleRapport, otherRapport] },
      RapportsActions.updateRapportSuccess({ rapport: updated }),
    );
    expect(state.rapports.find((r) => r._id === 'r1')).toEqual(updated);
    expect(state.rapports.find((r) => r._id === 'r2')).toEqual(otherRapport);
  });

  it('should handle updateRapportSuccess by updating selectedRapport when it matches', () => {
    const updated: InterventionReport = { ...sampleRapport, notes: 'Modifié' };
    const state = rapportsReducer(
      {
        ...initialRapportsState,
        rapports: [sampleRapport],
        selectedRapport: sampleRapport,
      },
      RapportsActions.updateRapportSuccess({ rapport: updated }),
    );
    expect(state.selectedRapport).toEqual(updated);
  });

  it('should handle updateRapportSuccess without changing selectedRapport when it does not match', () => {
    const updated: InterventionReport = { ...sampleRapport, notes: 'Modifié' };
    const state = rapportsReducer(
      {
        ...initialRapportsState,
        rapports: [sampleRapport, otherRapport],
        selectedRapport: otherRapport,
      },
      RapportsActions.updateRapportSuccess({ rapport: updated }),
    );
    expect(state.selectedRapport).toEqual(otherRapport);
  });

  it('should handle deleteRapportSuccess by removing the rapport from the list', () => {
    const state = rapportsReducer(
      { ...initialRapportsState, rapports: [sampleRapport, otherRapport] },
      RapportsActions.deleteRapportSuccess({ id: 'r1' }),
    );
    expect(state.rapports).toEqual([otherRapport]);
  });

  it('should handle deleteRapportSuccess by clearing selectedRapport when it matches', () => {
    const state = rapportsReducer(
      {
        ...initialRapportsState,
        rapports: [sampleRapport, otherRapport],
        selectedRapport: sampleRapport,
      },
      RapportsActions.deleteRapportSuccess({ id: 'r1' }),
    );
    expect(state.selectedRapport).toBeNull();
  });

  it('should handle deleteRapportSuccess without clearing selectedRapport when it does not match', () => {
    const state = rapportsReducer(
      {
        ...initialRapportsState,
        rapports: [sampleRapport, otherRapport],
        selectedRapport: otherRapport,
      },
      RapportsActions.deleteRapportSuccess({ id: 'r1' }),
    );
    expect(state.selectedRapport).toEqual(otherRapport);
  });

  it('should handle setSelected by updating selectedRapport', () => {
    const state = rapportsReducer(
      initialRapportsState,
      RapportsActions.setSelected({ rapport: sampleRapport }),
    );
    expect(state.selectedRapport).toEqual(sampleRapport);
  });

  it('should handle setSelected with null by clearing selectedRapport', () => {
    const state = rapportsReducer(
      { ...initialRapportsState, selectedRapport: sampleRapport },
      RapportsActions.setSelected({ rapport: null }),
    );
    expect(state.selectedRapport).toBeNull();
  });
});
