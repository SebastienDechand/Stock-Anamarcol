import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { ShipmentForm } from '../../../shared/models/shipment.model';
import { ShipmentsActions, FetchShipmentsParams } from './shipments.actions';
import {
  selectShipments,
  selectShipmentsLoaded,
  selectShipmentsLoading,
} from './shipments.selectors';

@Injectable({ providedIn: 'root' })
export class ShipmentsFacade {
  private store = inject(Store);

  shipments$ = this.store.select(selectShipments);
  isLoading$ = combineLatest([
    this.store.select(selectShipmentsLoading),
    this.store.select(selectShipmentsLoaded),
  ]).pipe(map(([loading, loaded]) => loading && !loaded));

  fetch(params: FetchShipmentsParams = {}) {
    this.store.dispatch(ShipmentsActions.fetchShipments({ params }));
  }
  create(data: ShipmentForm, createdByName: string) {
    this.store.dispatch(ShipmentsActions.createShipment({ data, createdByName }));
  }
  markSent(id: string, sentBy: string) {
    this.store.dispatch(ShipmentsActions.markSent({ id, sentBy }));
  }
  delete(id: string) {
    this.store.dispatch(ShipmentsActions.deleteShipment({ id }));
  }
}
