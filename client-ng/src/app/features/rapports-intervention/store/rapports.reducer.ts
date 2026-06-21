import { createReducer, on } from '@ngrx/store';
import { RapportsActions } from './rapports.actions';
import { initialRapportsState } from './rapports.state';
import { InterventionReport } from '../../../shared/models/intervention-report.model';

function replaceRapport(
  list: InterventionReport[],
  updated: InterventionReport,
): InterventionReport[] {
  const idx = list.findIndex((rapport) => rapport._id === updated._id);
  return idx >= 0
    ? list.map((rapport) => (rapport._id === updated._id ? updated : rapport))
    : [...list, updated];
}

export const rapportsReducer = createReducer(
  initialRapportsState,

  on(RapportsActions.loadAll, (state) => ({ ...state, isLoading: true })),
  on(RapportsActions.loadAllSuccess, (state, { rapports }) => ({
    ...state,
    rapports,
    loaded: true,
    isLoading: false,
    error: null,
  })),
  on(RapportsActions.loadAllFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(RapportsActions.loadByClientFileSuccess, (state, { rapports }) => ({
    ...state,
    rapports,
    isLoading: false,
  })),

  on(RapportsActions.loadOneSuccess, (state, { rapport }) => ({
    ...state,
    selectedRapport: rapport,
    rapports: replaceRapport(state.rapports, rapport),
  })),

  on(RapportsActions.createRapportSuccess, (state, { rapport }) => ({
    ...state,
    rapports: [...state.rapports, rapport],
  })),

  on(RapportsActions.updateRapportSuccess, (state, { rapport }) => ({
    ...state,
    rapports: replaceRapport(state.rapports, rapport),
    selectedRapport: state.selectedRapport?._id === rapport._id ? rapport : state.selectedRapport,
  })),

  on(RapportsActions.deleteRapportSuccess, (state, { id }) => ({
    ...state,
    rapports: state.rapports.filter((rapport) => rapport._id !== id),
    selectedRapport: state.selectedRapport?._id === id ? null : state.selectedRapport,
  })),

  on(RapportsActions.setSelected, (state, { rapport }) => ({ ...state, selectedRapport: rapport })),
);
