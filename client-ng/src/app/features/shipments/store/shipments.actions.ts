import { createActionGroup, props } from '@ngrx/store';
import { Shipment, ShipmentForm } from '../../../shared/models/shipment.model';

export interface FetchShipmentsParams {
  page?: number;
  limit?: number;
  sent?: boolean;
}

export const ShipmentsActions = createActionGroup({
  source: 'Shipments',
  events: {
    'Fetch Shipments': props<{ params: FetchShipmentsParams }>(),
    'Fetch Shipments Success': props<{ shipments: Shipment[] }>(),
    'Fetch Shipments Failure': props<{ error: string }>(),

    'Create Shipment': props<{ data: ShipmentForm; createdByName: string }>(),
    'Create Shipment Success': props<{ shipment: Shipment }>(),
    'Create Shipment Failure': props<{ error: string }>(),

    'Mark Sent': props<{ id: string; sentBy: string }>(),
    'Mark Sent Success': props<{ shipment: Shipment }>(),
    'Mark Sent Failure': props<{ error: string }>(),

    'Delete Shipment': props<{ id: string }>(),
    'Delete Shipment Success': props<{ id: string }>(),
    'Delete Shipment Failure': props<{ error: string }>(),
  },
});
