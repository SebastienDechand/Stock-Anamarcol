import { createFeatureSelector, createSelector } from '@ngrx/store';
import { VehiclesState } from './vehicles.state';

export const selectVehiclesState = createFeatureSelector<VehiclesState>('vehicles');

export const selectAllVehicles = createSelector(selectVehiclesState, (state) => state.vehicles);
export const selectVehiclesLoading = createSelector(
  selectVehiclesState,
  (state) => state.isLoading,
);
export const selectVehiclesLoaded = createSelector(selectVehiclesState, (state) => state.loaded);
export const selectSelectedVehicleId = createSelector(
  selectVehiclesState,
  (state) => state.selectedVehicleId,
);
export const selectSelectedVehicle = createSelector(
  selectVehiclesState,
  (state) => state.vehicles.find((vehicle) => vehicle._id === state.selectedVehicleId) ?? null,
);
export const selectVehiclesByModel = (model: string) =>
  createSelector(selectAllVehicles, (vehicles) =>
    vehicles.filter((vehicle) => vehicle.model === model),
  );
