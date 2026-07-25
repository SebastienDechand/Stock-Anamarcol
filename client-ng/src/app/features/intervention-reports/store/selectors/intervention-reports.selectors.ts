import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InterventionReportsState } from '../state/intervention-reports.state';

export const selectInterventionReportsState =
  createFeatureSelector<InterventionReportsState>('interventionReports');

export const selectAllInterventionReports = createSelector(
  selectInterventionReportsState,
  (state) => state.reports,
);
export const selectSelectedInterventionReport = createSelector(
  selectInterventionReportsState,
  (state) => state.selectedReport,
);
export const selectInterventionReportsLoading = createSelector(
  selectInterventionReportsState,
  (state) => state.isLoading,
);
export const selectInterventionReportsLoaded = createSelector(
  selectInterventionReportsState,
  (state) => state.loaded,
);
