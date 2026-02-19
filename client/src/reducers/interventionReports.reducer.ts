import {
  GET_ALL_INTERVENTION_REPORTS,
  GET_INTERVENTION_REPORT,
  SET_SELECTED_REPORT,
  UPDATE_INTERVENTION_REPORT,
  DELETE_INTERVENTION_REPORT,
} from "../actions/interventionReport.actions";
import type {
  InterventionReportsState,
  ReduxAction,
  InterventionReport,
} from "../types";

const initialState: InterventionReportsState = {
  reports: [],
  selectedReport: null,
  isLoading: false,
};

export default function interventionReportsReducer(
  state = initialState,
  action: ReduxAction,
): InterventionReportsState {
  switch (action.type) {
    case GET_ALL_INTERVENTION_REPORTS:
      return {
        ...state,
        reports: action.payload as InterventionReport[],
        isLoading: false,
      };

    case GET_INTERVENTION_REPORT:
      return { ...state, selectedReport: action.payload as InterventionReport };

    case SET_SELECTED_REPORT:
      return {
        ...state,
        selectedReport: action.payload as InterventionReport | null,
      };

    case UPDATE_INTERVENTION_REPORT: {
      const updated = action.payload as InterventionReport;
      return {
        ...state,
        reports: state.reports.map((r) =>
          r._id === updated._id ? updated : r,
        ),
        selectedReport:
          state.selectedReport?._id === updated._id
            ? updated
            : state.selectedReport,
      };
    }

    case DELETE_INTERVENTION_REPORT:
      return {
        ...state,
        reports: state.reports.filter(
          (r) => r._id !== (action.payload as string),
        ),
        selectedReport: null,
      };

    default:
      return state;
  }
}
