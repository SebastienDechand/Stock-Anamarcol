import { InterventionReport } from '../../../shared/models/intervention-report.model';

export interface RapportsState {
  rapports: InterventionReport[];
  selectedRapport: InterventionReport | null;
  loaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialRapportsState: RapportsState = {
  rapports: [],
  selectedRapport: null,
  loaded: false,
  isLoading: false,
  error: null,
};
