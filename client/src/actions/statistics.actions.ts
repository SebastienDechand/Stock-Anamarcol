import axios from "axios";
import type { AppDispatch, ReduxAction } from "../types";

export const SET_GLOBAL_STATISTICS = "SET_GLOBAL_STATISTICS";
export const SET_ARTICLES_WITH_LOW_STOCK = "SET_ARTICLES_WITH_LOW_STOCK";
export const SET_SUPPLIER_STATISTICS = "SET_SUPPLIER_STATISTICS";
export const SET_STATUS_STATISTICS = "SET_STATUS_STATISTICS";
export const SET_STATUSES_LIST = "SET_STATUSES_LIST";
export const SET_SUPPLIERS_LIST = "SET_SUPPLIERS_LIST";

// Global Statistics
export const setGlobalStatistics = (statistics: unknown): ReduxAction => ({
  type: SET_GLOBAL_STATISTICS,
  payload: statistics,
});

export const fetchStatistics = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/articles`,
      );
      dispatch(setGlobalStatistics(response.data));
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };
};

export const fetchTotalStock = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/stock`,
      );
      dispatch(setGlobalStatistics(response.data));
    } catch (error) {
      console.error("Error fetching total stock:", error);
    }
  };
};

export const fetchNumberOfSuppliers = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/suppliers`,
      );
      dispatch(setGlobalStatistics(response.data));
    } catch (error) {
      console.error("Error fetching number of suppliers:", error);
    }
  };
};

export const fetchNumberOfArticlesWithStockBelow5 = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/articles/stockinf5`,
      );
      dispatch(setGlobalStatistics(response.data));
    } catch (error) {
      console.error("Error fetching number of low-stock articles:", error);
    }
  };
};

export const fetchArticlesWithLowStock = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/articles/low-stock`,
      );
      dispatch({
        type: SET_ARTICLES_WITH_LOW_STOCK,
        payload: response.data,
      });
    } catch (error) {
      console.error("Error fetching articles with low stock:", error);
    }
  };
};

// Suppliers
export const setSuppliersList = (suppliersList: string[]): ReduxAction => ({
  type: SET_SUPPLIERS_LIST,
  payload: suppliersList,
});

export const fetchSuppliersList = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/suppliers/list`,
      );
      dispatch(setSuppliersList(response.data.suppliersList));
    } catch (error) {
      console.error("Error fetching suppliers list:", error);
    }
  };
};

export const setSupplierStatistics = (
  statistics: unknown,
  supplier: string,
): ReduxAction => ({
  type: SET_SUPPLIER_STATISTICS,
  payload: { statistics, supplier },
});

export const fetchStatisticsForSupplier = (supplier: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/suppliers/${supplier}`,
      );
      dispatch(setSupplierStatistics(response.data, supplier));
    } catch (error) {
      console.error(
        `Error fetching statistics for supplier ${supplier}:`,
        error,
      );
    }
  };
};

// Statuses
export const setStatusesList = (statusesList: string[]): ReduxAction => ({
  type: SET_STATUSES_LIST,
  payload: statusesList,
});

export const fetchStatusesList = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/statuses/list`,
      );
      dispatch(setStatusesList(response.data.statusesList));
    } catch (error) {
      console.error("Error fetching states list:", error);
    }
  };
};

export const setStatusStatistics = (
  statistics: unknown,
  status: string,
): ReduxAction => ({
  type: SET_STATUS_STATISTICS,
  payload: { statistics, status },
});

export const fetchStatisticsForStatus = (status: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/statuses/${status}`,
      );
      dispatch(setStatusStatistics(response.data, status));
    } catch (error) {
      console.error(`Error fetching statistics for status ${status}:`, error);
    }
  };
};
