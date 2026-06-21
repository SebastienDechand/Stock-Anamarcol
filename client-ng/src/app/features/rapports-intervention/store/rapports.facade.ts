import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import {
  InterventionReport,
  InterventionReportForm,
} from '../../../shared/models/intervention-report.model';
import { RapportsActions } from './rapports.actions';
import {
  selectAllRapports,
  selectRapportsLoaded,
  selectRapportsLoading,
  selectSelectedRapport,
} from './rapports.selectors';

@Injectable({ providedIn: 'root' })
export class RapportsFacade {
  private store = inject(Store);

  rapports$ = this.store.select(selectAllRapports);
  selectedRapport$ = this.store.select(selectSelectedRapport);
  isLoading$ = combineLatest([
    this.store.select(selectRapportsLoading),
    this.store.select(selectRapportsLoaded),
  ]).pipe(map(([loading, loaded]) => loading && !loaded));

  loadAll() {
    this.store.dispatch(RapportsActions.loadAll());
  }
  loadByClientFile(clientFileId: string) {
    this.store.dispatch(RapportsActions.loadByClientFile({ clientFileId }));
  }
  loadOne(id: string) {
    this.store.dispatch(RapportsActions.loadOne({ id }));
  }
  create(data: Partial<InterventionReportForm>) {
    this.store.dispatch(RapportsActions.createRapport({ data }));
  }
  update(id: string, data: Partial<InterventionReportForm>) {
    this.store.dispatch(RapportsActions.updateRapport({ id, data }));
  }
  delete(id: string) {
    this.store.dispatch(RapportsActions.deleteRapport({ id }));
  }
  setSelected(rapport: InterventionReport | null) {
    this.store.dispatch(RapportsActions.setSelected({ rapport }));
  }
}
