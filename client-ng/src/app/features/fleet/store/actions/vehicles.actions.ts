import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Vehicle, VehicleForm } from '../../../../shared/models/vehicle/vehicle.model';

export const VehiclesActions = createActionGroup({
  source: 'Vehicles',
  events: {
    'Load All': emptyProps(),
    'Load All Success': props<{ vehicles: Vehicle[] }>(),
    'Load All Failure': props<{ error: string }>(),

    'Load One': props<{ id: string }>(),
    'Load One Success': props<{ vehicle: Vehicle }>(),

    Search: props<{ q: string }>(),
    'Search Success': props<{ vehicles: Vehicle[] }>(),

    'Create Vehicle': props<{ data: VehicleForm }>(),
    'Create Vehicle Success': props<{ vehicle: Vehicle }>(),
    'Create Vehicle Failure': props<{ error: string }>(),

    'Update Vehicle': props<{ id: string; data: Partial<VehicleForm> }>(),
    'Update Vehicle Success': props<{ vehicle: Vehicle }>(),
    'Update Vehicle Failure': props<{ error: string }>(),

    'Delete Vehicle': props<{ id: string }>(),
    'Delete Vehicle Success': props<{ id: string }>(),
    'Delete Vehicle Failure': props<{ error: string }>(),

    'Upload Document': props<{ id: string; formData: FormData }>(),
    'Upload Document Success': props<{ vehicle: Vehicle }>(),
    'Upload Document Failure': props<{ error: string }>(),

    'Delete Document': props<{ vehicleId: string; docId: string }>(),
    'Delete Document Success': props<{ vehicle: Vehicle }>(),
    'Delete Document Failure': props<{ error: string }>(),

    'Set Selected': props<{ id: string | null }>(),
  },
});
