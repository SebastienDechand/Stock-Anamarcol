import { Vehicle } from '../../../shared/models/vehicle.model';

export interface VehiclesState {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  loaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialVehiclesState: VehiclesState = {
  vehicles: [],
  selectedVehicleId: null,
  loaded: false,
  isLoading: false,
  error: null,
};
