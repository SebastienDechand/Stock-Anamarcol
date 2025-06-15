import {
  SET_GLOBAL_STATISTICS,
  SET_ARTICLES_WITH_LOW_STOCK,
  SET_FOURNISSEUR_STATISTICS,
  SET_ETAT_STATISTICS,
  SET_FOURNISSEURS_LIST,
  SET_ETATS_LIST,
} from "../actions/statistics.actions";

const initialState = {
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

const statisticsReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_GLOBAL_STATISTICS:
      return {
        ...state,
        globalStatistics: {
          ...state.globalStatistics,
          ...action.payload,
        },
      };
    case SET_ARTICLES_WITH_LOW_STOCK:
      return {
        ...state,
        articlesWithLowStock: action.payload,
      };
    case SET_FOURNISSEUR_STATISTICS:
      return {
        ...state,
        fournisseursStats: {
          ...state.fournisseursStats,
          [action.payload.fournisseur]: action.payload.statistics,
        },
      };
    case SET_ETAT_STATISTICS:
      return {
        ...state,
        etatsStats: {
          ...state.etatsStats,
          [action.payload.etat]: action.payload.statistics,
        },
      };
    case SET_FOURNISSEURS_LIST:
      return {
        ...state,
        fournisseursList: action.payload,
      };
    case SET_ETATS_LIST:
      return {
        ...state,
        etatsList: action.payload,
      };
    default:
      return state;
  }
};

export default statisticsReducer;
