import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { Vehicle, VehicleForm } from '../../../../shared/models/vehicle/vehicle.model';
import { VehiclesActions } from '../actions/vehicles.actions';
import {
  selectAllVehicles,
  selectSelectedVehicle,
  selectSelectedVehicleId,
  selectVehiclesLoaded,
  selectVehiclesLoading,
} from '../selectors/vehicles.selectors';

@Injectable({ providedIn: 'root' })
export class VehiclesFacade {
  private store = inject(Store);

  vehicles$ = this.store.select(selectAllVehicles);
  isLoading$ = combineLatest([
    this.store.select(selectVehiclesLoading),
    this.store.select(selectVehiclesLoaded),
  ]).pipe(map(([loading, loaded]) => loading && !loaded));
  selectedVehicle$ = this.store.select(selectSelectedVehicle);
  selectedVehicleId$ = this.store.select(selectSelectedVehicleId);

  loadAll() {
    this.store.dispatch(VehiclesActions.loadAll());
  }
  search(q: string) {
    this.store.dispatch(VehiclesActions.search({ q }));
  }
  create(data: VehicleForm) {
    this.store.dispatch(VehiclesActions.createVehicle({ data }));
  }
  update(id: string, data: Partial<VehicleForm>) {
    this.store.dispatch(VehiclesActions.updateVehicle({ id, data }));
  }
  delete(id: string) {
    this.store.dispatch(VehiclesActions.deleteVehicle({ id }));
  }
  uploadDocument(id: string, formData: FormData) {
    this.store.dispatch(VehiclesActions.uploadDocument({ id, formData }));
  }
  deleteDocument(vehicleId: string, docId: string) {
    this.store.dispatch(VehiclesActions.deleteDocument({ vehicleId, docId }));
  }
  setSelected(id: string | null) {
    this.store.dispatch(VehiclesActions.setSelected({ id }));
  }
}
