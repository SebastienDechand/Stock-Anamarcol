import { Shipment } from '../../../../shared/models/shipment/shipment.model';

export interface ShipmentsState {
  shipments: Shipment[];
  loaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialShipmentsState: ShipmentsState = {
  shipments: [],
  loaded: false,
  isLoading: false,
  error: null,
};
