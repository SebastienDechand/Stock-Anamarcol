import { describe, it, expect } from 'vitest';
import { vehiclesReducer } from '../vehicles.reducer';
import { VehiclesActions } from '../vehicles.actions';
import { initialVehiclesState } from '../vehicles.state';
import type { Vehicle } from '../../../../shared/models/vehicle.model';

const vehicle1: Vehicle = {
  _id: '1',
  marque: 'mercedes',
  modele: 'vito',
  format: 'utilitaire',
  immatriculation: 'AA-123-BB',
  documents: [],
};

const vehicle2: Vehicle = {
  _id: '2',
  marque: 'nissan',
  modele: 'navara',
  format: 'pickup',
  immatriculation: 'CC-456-DD',
  documents: [],
};

describe('vehiclesReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = vehiclesReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialVehiclesState);
  });

  it('should handle loadAllSuccess', () => {
    const state = vehiclesReducer(
      { ...initialVehiclesState, isLoading: true },
      VehiclesActions.loadAllSuccess({ vehicles: [vehicle1, vehicle2] }),
    );
    expect(state.vehicles).toEqual([vehicle1, vehicle2]);
    expect(state.loaded).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  describe('replaceVehicle upsert behaviour (loadOneSuccess)', () => {
    it('should replace an existing vehicle in place', () => {
      const updated: Vehicle = { ...vehicle1, immatriculation: 'AA-999-ZZ' };
      const state = vehiclesReducer(
        { ...initialVehiclesState, vehicles: [vehicle1, vehicle2] },
        VehiclesActions.loadOneSuccess({ vehicle: updated }),
      );
      expect(state.vehicles).toEqual([updated, vehicle2]);
    });

    it('should append the vehicle when it is not already in the list', () => {
      const state = vehiclesReducer(
        { ...initialVehiclesState, vehicles: [vehicle1] },
        VehiclesActions.loadOneSuccess({ vehicle: vehicle2 }),
      );
      expect(state.vehicles).toEqual([vehicle1, vehicle2]);
    });
  });

  it('should append a new vehicle on createVehicleSuccess', () => {
    const state = vehiclesReducer(
      { ...initialVehiclesState, vehicles: [vehicle1] },
      VehiclesActions.createVehicleSuccess({ vehicle: vehicle2 }),
    );
    expect(state.vehicles).toEqual([vehicle1, vehicle2]);
  });

  it('should update a vehicle on updateVehicleSuccess', () => {
    const updated: Vehicle = { ...vehicle1, format: 'camion' };
    const state = vehiclesReducer(
      { ...initialVehiclesState, vehicles: [vehicle1] },
      VehiclesActions.updateVehicleSuccess({ vehicle: updated }),
    );
    expect(state.vehicles).toEqual([updated]);
  });

  describe('deleteVehicleSuccess', () => {
    it('should remove the vehicle from the list', () => {
      const state = vehiclesReducer(
        { ...initialVehiclesState, vehicles: [vehicle1, vehicle2] },
        VehiclesActions.deleteVehicleSuccess({ id: '1' }),
      );
      expect(state.vehicles).toEqual([vehicle2]);
    });

    it('should clear selectedVehicleId when the deleted vehicle was selected', () => {
      const state = vehiclesReducer(
        { ...initialVehiclesState, vehicles: [vehicle1], selectedVehicleId: '1' },
        VehiclesActions.deleteVehicleSuccess({ id: '1' }),
      );
      expect(state.selectedVehicleId).toBeNull();
    });

    it('should leave selectedVehicleId untouched when a different vehicle is deleted', () => {
      const state = vehiclesReducer(
        { ...initialVehiclesState, vehicles: [vehicle1, vehicle2], selectedVehicleId: '2' },
        VehiclesActions.deleteVehicleSuccess({ id: '1' }),
      );
      expect(state.selectedVehicleId).toBe('2');
    });
  });

  it('should handle setSelected', () => {
    const state = vehiclesReducer(initialVehiclesState, VehiclesActions.setSelected({ id: '1' }));
    expect(state.selectedVehicleId).toBe('1');
  });
});
