import {
  SET_GLOBAL_STATISTICS,
  SET_ARTICLES_WITH_LOW_STOCK,
  SET_SUPPLIER_STATISTICS,
  SET_STATUS_STATISTICS,
  SET_SUPPLIERS_LIST,
  SET_STATUSES_LIST,
} from "../actions/statistics.actions";
import type {
  StatisticsState,
  ReduxAction,
  SupplierStats,
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
  suppliersStats: {},
  statusesStats: {},
  suppliersList: [],
  statusesList: [],
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
    case SET_SUPPLIER_STATISTICS: {
      const payload = action.payload as {
        supplier: string;
        statistics: SupplierStats;
      };
      return {
        ...state,
        suppliersStats: {
          ...state.suppliersStats,
          [payload.supplier]: payload.statistics,
        },
      };
    }
    case SET_STATUS_STATISTICS: {
      const payload = action.payload as {
        status: string;
        statistics: SupplierStats;
      };
      return {
        ...state,
        statusesStats: {
          ...state.statusesStats,
          [payload.status]: payload.statistics,
        },
      };
    }
    case SET_SUPPLIERS_LIST:
      return {
        ...state,
        suppliersList: action.payload as string[],
      };
    case SET_STATUSES_LIST:
      return {
        ...state,
        statusesList: action.payload as string[],
      };
    default:
      return state;
  }
};

export default statisticsReducer;
