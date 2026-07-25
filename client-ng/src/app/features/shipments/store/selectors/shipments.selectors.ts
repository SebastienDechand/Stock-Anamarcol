import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ShipmentsState } from '../state/shipments.state';

export const selectShipmentsState = createFeatureSelector<ShipmentsState>('shipments');

export const selectShipments = createSelector(selectShipmentsState, (state) => state.shipments);
export const selectShipmentsLoading = createSelector(
  selectShipmentsState,
  (state) => state.isLoading,
);
export const selectShipmentsLoaded = createSelector(selectShipmentsState, (state) => state.loaded);
