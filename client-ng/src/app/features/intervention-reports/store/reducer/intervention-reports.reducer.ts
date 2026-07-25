import { createReducer, on } from '@ngrx/store';
import { InterventionReportsActions } from '../actions/intervention-reports.actions';
import { initialInterventionReportsState } from '../state/intervention-reports.state';
import { InterventionReport } from '../../../../shared/models/intervention-report/intervention-report.model';

function replaceReport(
  list: InterventionReport[],
  updated: InterventionReport,
): InterventionReport[] {
  const index = list.findIndex((report) => report._id === updated._id);
  return index >= 0
    ? list.map((report) => (report._id === updated._id ? updated : report))
    : [...list, updated];
}

export const interventionReportsReducer = createReducer(
  initialInterventionReportsState,

  on(InterventionReportsActions.loadAll, (state) => ({ ...state, isLoading: true })),
  on(InterventionReportsActions.loadAllSuccess, (state, { reports }) => ({
    ...state,
    reports,
    loaded: true,
    isLoading: false,
    error: null,
  })),
  on(InterventionReportsActions.loadAllFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(InterventionReportsActions.loadByClientFileSuccess, (state, { reports }) => ({
    ...state,
    reports,
    isLoading: false,
  })),

  on(InterventionReportsActions.loadOneSuccess, (state, { report }) => ({
    ...state,
    selectedReport: report,
    reports: replaceReport(state.reports, report),
  })),

  on(InterventionReportsActions.createReportSuccess, (state, { report }) => ({
    ...state,
    reports: [...state.reports, report],
  })),

  on(InterventionReportsActions.updateReportSuccess, (state, { report }) => ({
    ...state,
    reports: replaceReport(state.reports, report),
    selectedReport: state.selectedReport?._id === report._id ? report : state.selectedReport,
  })),

  on(InterventionReportsActions.deleteReportSuccess, (state, { id }) => ({
    ...state,
    reports: state.reports.filter((report) => report._id !== id),
    selectedReport: state.selectedReport?._id === id ? null : state.selectedReport,
  })),

  on(InterventionReportsActions.setSelected, (state, { report }) => ({
    ...state,
    selectedReport: report,
  })),
);
