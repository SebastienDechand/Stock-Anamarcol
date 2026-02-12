import {
  SET_GLOBAL_STATISTICS,
  SET_ARTICLES_WITH_LOW_STOCK,
  SET_FOURNISSEUR_STATISTICS,
  SET_ETAT_STATISTICS,
  SET_FOURNISSEURS_LIST,
  SET_ETATS_LIST,
} from "../actions/statistics.actions";
import type {
  StatisticsState,
  ReduxAction,
  FournisseurStats,
  Item,
} from "../types";

const initialState: StatisticsState = {
  globalStatistics: {
    numberOfArticles: 0,
    totalStock: 0,
    numberOfSuppliers: 0,
    numberOfLowStockArticles: 0,
  },
  articlesWithLowStock: [],
  fournisseursStats: {},
  etatsStats: {},
  fournisseursList: [],
  etatsList: [],
};

const statisticsReducer = (
  state = initialState,
  action: ReduxAction,
): StatisticsState => {
  switch (action.type) {
    case SET_GLOBAL_STATISTICS:
      return {
        ...state,
        globalStatistics: {
          ...state.globalStatistics,
          ...(action.payload as Partial<StatisticsState["globalStatistics"]>),
        },
      };
    case SET_ARTICLES_WITH_LOW_STOCK:
      return {
        ...state,
        articlesWithLowStock: action.payload as Item[],
      };
    case SET_FOURNISSEUR_STATISTICS: {
      const payload = action.payload as {
        fournisseur: string;
        statistics: FournisseurStats;
      };
      return {
        ...state,
        fournisseursStats: {
          ...state.fournisseursStats,
          [payload.fournisseur]: payload.statistics,
        },
      };
    }
    case SET_ETAT_STATISTICS: {
      const payload = action.payload as {
        etat: string;
        statistics: FournisseurStats;
      };
      return {
        ...state,
        etatsStats: {
          ...state.etatsStats,
          [payload.etat]: payload.statistics,
        },
      };
    }
    case SET_FOURNISSEURS_LIST:
      return {
        ...state,
        fournisseursList: action.payload as string[],
      };
    case SET_ETATS_LIST:
      return {
        ...state,
        etatsList: action.payload as string[],
      };
    default:
      return state;
  }
};

export default statisticsReducer;
