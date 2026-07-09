import { describe, it, expect } from 'vitest';
import {
  selectAllVehicles,
  selectVehiclesLoading,
  selectVehiclesLoaded,
  selectSelectedVehicleId,
  selectSelectedVehicle,
  selectVehiclesByModel,
} from '../vehicles.selectors';
import { initialVehiclesState } from '../vehicles.state';
import type { Vehicle } from '../../../../shared/models/vehicle.model';

const sampleVehicle: Vehicle = {
  _id: 'v-1',
  marque: 'mercedes',
  modele: 'citan',
  format: 'utilitaire',
  immatriculation: 'AB-123-CD',
  documents: [],
};

const sampleVehicle2: Vehicle = {
  _id: 'v-2',
  marque: 'nissan',
  modele: 'navara',
  format: 'pickup',
  immatriculation: 'EF-456-GH',
  documents: [],
};

const sampleVehicle3: Vehicle = {
  _id: 'v-3',
  marque: 'mercedes',
  modele: 'vito',
  format: 'utilitaire',
  immatriculation: 'IJ-789-KL',
  documents: [],
};

describe('Vehicles Selectors', () => {
  describe('selectAllVehicles', () => {
    it('should return empty array from initial state', () => {
      const state = { vehicles: initialVehiclesState };
      expect(selectAllVehicles(state)).toEqual([]);
    });

    it('should return vehicles when populated', () => {
      const state = {
        vehicles: { ...initialVehiclesState, vehicles: [sampleVehicle, sampleVehicle2] },
      };
      expect(selectAllVehicles(state)).toEqual([sampleVehicle, sampleVehicle2]);
    });
  });

  describe('selectVehiclesLoading', () => {
    it('should return false from initial state', () => {
      const state = { vehicles: initialVehiclesState };
      expect(selectVehiclesLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = { vehicles: { ...initialVehiclesState, isLoading: true } };
      expect(selectVehiclesLoading(state)).toBe(true);
    });
  });

  describe('selectVehiclesLoaded', () => {
    it('should return false from initial state', () => {
      const state = { vehicles: initialVehiclesState };
      expect(selectVehiclesLoaded(state)).toBe(false);
    });

    it('should return true when loaded', () => {
      const state = { vehicles: { ...initialVehiclesState, loaded: true } };
      expect(selectVehiclesLoaded(state)).toBe(true);
    });
  });

  describe('selectSelectedVehicleId', () => {
    it('should return null from initial state', () => {
      const state = { vehicles: initialVehiclesState };
      expect(selectSelectedVehicleId(state)).toBeNull();
    });

    it('should return the selected vehicle id when set', () => {
      const state = { vehicles: { ...initialVehiclesState, selectedVehicleId: 'v-1' } };
      expect(selectSelectedVehicleId(state)).toBe('v-1');
    });
  });

  describe('selectSelectedVehicle', () => {
    it('should return null from initial state', () => {
      const state = { vehicles: initialVehiclesState };
      expect(selectSelectedVehicle(state)).toBeNull();
    });

    it('should return null when selectedVehicleId does not match any vehicle', () => {
      const state = {
        vehicles: {
          ...initialVehiclesState,
          vehicles: [sampleVehicle],
          selectedVehicleId: 'v-999',
        },
      };
      expect(selectSelectedVehicle(state)).toBeNull();
    });

    it('should return the matching vehicle when selectedVehicleId matches', () => {
      const state = {
        vehicles: {
          ...initialVehiclesState,
          vehicles: [sampleVehicle, sampleVehicle2, sampleVehicle3],
          selectedVehicleId: 'v-2',
        },
      };
      expect(selectSelectedVehicle(state)).toEqual(sampleVehicle2);
    });
  });

  describe('selectVehiclesByModel', () => {
    it('should return empty array when no vehicles', () => {
      const state = { vehicles: initialVehiclesState };
      const selector = selectVehiclesByModel('citan');
      expect(selector(state)).toEqual([]);
    });

    it('should return vehicles matching the given model', () => {
      const state = {
        vehicles: {
          ...initialVehiclesState,
          vehicles: [sampleVehicle, sampleVehicle2, sampleVehicle3],
        },
      };
      const selector = selectVehiclesByModel('citan');
      expect(selector(state)).toEqual([sampleVehicle]);
    });

    it('should return multiple vehicles matching the given model', () => {
      const anotherCitan: Vehicle = {
        _id: 'v-4',
        marque: 'mercedes',
        modele: 'citan',
        format: 'utilitaire',
        immatriculation: 'MN-000-OP',
        documents: [],
      };
      const state = {
        vehicles: {
          ...initialVehiclesState,
          vehicles: [sampleVehicle, sampleVehicle2, anotherCitan],
        },
      };
      const selector = selectVehiclesByModel('citan');
      expect(selector(state)).toEqual([sampleVehicle, anotherCitan]);
    });

    it('should return empty array when no vehicle matches the given model', () => {
      const state = {
        vehicles: {
          ...initialVehiclesState,
          vehicles: [sampleVehicle, sampleVehicle2],
        },
      };
      const selector = selectVehiclesByModel('vito');
      expect(selector(state)).toEqual([]);
    });
  });
});
