import axios from "axios";
import type { AppDispatch, ReduxAction } from "../types";

export const SET_GLOBAL_STATISTICS = "SET_GLOBAL_STATISTICS";
export const SET_ARTICLES_WITH_LOW_STOCK = "SET_ARTICLES_WITH_LOW_STOCK";
export const SET_FOURNISSEUR_STATISTICS = "SET_FOURNISSEUR_STATISTICS";
export const SET_ETAT_STATISTICS = "SET_ETAT_STATISTICS";
export const SET_ETATS_LIST = "SET_ETATS_LIST";
export const SET_FOURNISSEURS_LIST = "SET_FOURNISSEURS_LIST";

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
      console.error("Erreur lors de la récupération des statistiques :", error);
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
      console.error("Erreur lors de la récupération du stock total :", error);
    }
  };
};

export const fetchNumberOfSuppliers = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/fournisseurs`,
      );
      dispatch(setGlobalStatistics(response.data));
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du nombre de fournisseurs :",
        error,
      );
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
      console.error(
        "Erreur lors de la récupération du nombre d'articles avec un stock inférieur à 5 :",
        error,
      );
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

// Fournisseurs
export const setFournisseursList = (
  fournisseursList: string[],
): ReduxAction => ({
  type: SET_FOURNISSEURS_LIST,
  payload: fournisseursList,
});

export const fetchFournisseursList = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/fournisseurs/list`,
      );
      dispatch(setFournisseursList(response.data.fournisseursList));
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la liste des fournisseurs :",
        error,
      );
    }
  };
};

export const setFournisseurStatistics = (
  statistics: unknown,
  fournisseur: string,
): ReduxAction => ({
  type: SET_FOURNISSEUR_STATISTICS,
  payload: { statistics, fournisseur },
});

export const fetchStatisticsForFournisseur = (fournisseur: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/fournisseurs/${fournisseur}`,
      );
      dispatch(setFournisseurStatistics(response.data, fournisseur));
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des statistiques pour le fournisseur ${fournisseur} :`,
        error,
      );
    }
  };
};

// États
export const setEtatsList = (etatsList: string[]): ReduxAction => ({
  type: SET_ETATS_LIST,
  payload: etatsList,
});

export const fetchEtatsList = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/etats/list`,
      );
      dispatch(setEtatsList(response.data.etatsList));
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la liste des états :",
        error,
      );
    }
  };
};

export const setEtatStatistics = (
  statistics: unknown,
  etat: string,
): ReduxAction => ({
  type: SET_ETAT_STATISTICS,
  payload: { statistics, etat },
});

export const fetchStatisticsForEtat = (etat: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/statistics/etats/${etat}`,
      );
      dispatch(setEtatStatistics(response.data, etat));
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des statistiques pour le fournisseur ${etat} :`,
        error,
      );
    }
  };
};
