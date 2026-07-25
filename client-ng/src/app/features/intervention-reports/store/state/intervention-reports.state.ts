import { InterventionReport } from '../../../../shared/models/intervention-report/intervention-report.model';

export interface InterventionReportsState {
  reports: InterventionReport[];
  selectedReport: InterventionReport | null;
  loaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialInterventionReportsState: InterventionReportsState = {
  reports: [],
  selectedReport: null,
  loaded: false,
  isLoading: false,
  error: null,
};
