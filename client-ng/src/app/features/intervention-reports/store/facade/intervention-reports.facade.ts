import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import {
  InterventionReport,
  InterventionReportForm,
} from '../../../../shared/models/intervention-report/intervention-report.model';
import { InterventionReportsActions } from '../actions/intervention-reports.actions';
import {
  selectAllInterventionReports,
  selectInterventionReportsLoaded,
  selectInterventionReportsLoading,
  selectSelectedInterventionReport,
} from '../selectors/intervention-reports.selectors';

@Injectable({ providedIn: 'root' })
export class InterventionReportsFacade {
  private store = inject(Store);

  reports$ = this.store.select(selectAllInterventionReports);
  selectedReport$ = this.store.select(selectSelectedInterventionReport);
  isLoading$ = combineLatest([
    this.store.select(selectInterventionReportsLoading),
    this.store.select(selectInterventionReportsLoaded),
  ]).pipe(map(([loading, loaded]) => loading && !loaded));

  loadAll() {
    this.store.dispatch(InterventionReportsActions.loadAll());
  }
  loadByClientFile(clientFileId: string) {
    this.store.dispatch(InterventionReportsActions.loadByClientFile({ clientFileId }));
  }
  loadOne(id: string) {
    this.store.dispatch(InterventionReportsActions.loadOne({ id }));
  }
  create(data: Partial<InterventionReportForm>) {
    this.store.dispatch(InterventionReportsActions.createReport({ data }));
  }
  update(id: string, data: Partial<InterventionReportForm>) {
    this.store.dispatch(InterventionReportsActions.updateReport({ id, data }));
  }
  delete(id: string) {
    this.store.dispatch(InterventionReportsActions.deleteReport({ id }));
  }
  setSelected(report: InterventionReport | null) {
    this.store.dispatch(InterventionReportsActions.setSelected({ report }));
  }
}
