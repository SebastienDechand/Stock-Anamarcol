import { createReducer, on } from '@ngrx/store';
import { ShipmentsActions } from '../actions/shipments.actions';
import { initialShipmentsState } from '../state/shipments.state';

export const shipmentsReducer = createReducer(
  initialShipmentsState,

  on(ShipmentsActions.fetchShipments, (state) => ({ ...state, isLoading: true })),
  on(ShipmentsActions.fetchShipmentsSuccess, (state, { shipments }) => ({
    ...state,
    shipments,
    loaded: true,
    isLoading: false,
    error: null,
  })),
  on(ShipmentsActions.fetchShipmentsFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(ShipmentsActions.createShipmentSuccess, (state, { shipment }) => ({
    ...state,
    shipments: [shipment, ...state.shipments],
  })),

  on(ShipmentsActions.markSentSuccess, (state, { shipment }) => ({
    ...state,
    shipments: state.shipments.map((existing) =>
      existing._id === shipment._id ? shipment : existing,
    ),
  })),

  on(ShipmentsActions.deleteShipmentSuccess, (state, { id }) => ({
    ...state,
    shipments: state.shipments.filter((shipment) => shipment._id !== id),
  })),
);
