import { createReducer, on } from '@ngrx/store';
import { VehiclesActions } from './vehicles.actions';
import { initialVehiclesState } from './vehicles.state';
import { Vehicle } from '../../../shared/models/vehicle.model';

function replaceVehicle(list: Vehicle[], updated: Vehicle): Vehicle[] {
  const index = list.findIndex((vehicle) => vehicle._id === updated._id);
  return index >= 0
    ? list.map((vehicle) => (vehicle._id === updated._id ? updated : vehicle))
    : [...list, updated];
}

export const vehiclesReducer = createReducer(
  initialVehiclesState,

  on(VehiclesActions.loadAll, (state) => ({ ...state, isLoading: true })),
  on(VehiclesActions.loadAllSuccess, (state, { vehicles }) => ({
    ...state,
    vehicles,
    loaded: true,
    isLoading: false,
    error: null,
  })),
  on(VehiclesActions.loadAllFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(VehiclesActions.loadOneSuccess, (state, { vehicle }) => ({
    ...state,
    vehicles: replaceVehicle(state.vehicles, vehicle),
  })),

  on(VehiclesActions.searchSuccess, (state, { vehicles }) => ({
    ...state,
    vehicles,
    isLoading: false,
  })),

  on(VehiclesActions.createVehicleSuccess, (state, { vehicle }) => ({
    ...state,
    vehicles: [...state.vehicles, vehicle],
  })),

  on(VehiclesActions.updateVehicleSuccess, (state, { vehicle }) => ({
    ...state,
    vehicles: replaceVehicle(state.vehicles, vehicle),
  })),

  on(VehiclesActions.deleteVehicleSuccess, (state, { id }) => ({
    ...state,
    vehicles: state.vehicles.filter((vehicle) => vehicle._id !== id),
    selectedVehicleId: state.selectedVehicleId === id ? null : state.selectedVehicleId,
  })),

  on(VehiclesActions.uploadDocumentSuccess, (state, { vehicle }) => ({
    ...state,
    vehicles: replaceVehicle(state.vehicles, vehicle),
  })),

  on(VehiclesActions.deleteDocumentSuccess, (state, { vehicle }) => ({
    ...state,
    vehicles: replaceVehicle(state.vehicles, vehicle),
  })),

  on(VehiclesActions.setSelected, (state, { id }) => ({ ...state, selectedVehicleId: id })),
);
