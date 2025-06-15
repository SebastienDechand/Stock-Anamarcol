import axios from 'axios';

export const SET_GLOBAL_STATISTICS = 'SET_GLOBAL_STATISTICS';
export const SET_ARTICLES_WITH_LOW_STOCK = "SET_ARTICLES_WITH_LOW_STOCK"
export const SET_FOURNISSEUR_STATISTICS = 'SET_FOURNISSEUR_STATISTICS';
export const SET_ETAT_STATISTICS = "SET_ETAT_STATISTICS"
export const SET_ETATS_LIST = "SET_ETATS_LIST";
export const SET_FOURNISSEURS_LIST = 'SET_FOURNISSEURS_LIST';

// Global Statistics
export const setGlobalStatistics = (statistics) => ({
  type: SET_GLOBAL_STATISTICS,
  payload: statistics,
});

export const fetchStatistics = () => {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}api/statistics/articles`);
      const data = response.data;

      dispatch(setGlobalStatistics(data));
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques :', error);
    }
  };
};

export const fetchTotalStock = () => {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}api/statistics/stock`);
      const data = response.data;

      dispatch(setGlobalStatistics(data));
    } catch (error) {
      console.error('Erreur lors de la récupération du stock total :', error);
    }
  };
};
export const fetchNumberOfSuppliers = () => {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}api/statistics/fournisseurs`);
      const data = response.data;

      dispatch(setGlobalStatistics(data));
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de fournisseurs :', error);
    }
  };
};

export const fetchNumberOfArticlesWithStockBelow5 = () => {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}api/statistics/articles/stockinf5`);
      const data = response.data;

      dispatch(setGlobalStatistics(data));
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre d\'articles avec un stock inférieur à 5 :', error);
    }
  };
};

export const fetchArticlesWithLowStock = () => {
  return async (dispatch) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}api/statistics/articles/low-stock`);
      const data = await response.json();

      dispatch({
        type: SET_ARTICLES_WITH_LOW_STOCK,
        payload: data,
      });
    } catch (error) {
      console.error('Error fetching articles with low stock:', error);
    }
  };
};

// Fournisseurs
export const setFournisseursList = (fournisseursList) => ({
    type: SET_FOURNISSEURS_LIST,
    payload: fournisseursList,
});
export const fetchFournisseursList = () => {
    return async (dispatch) => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}api/statistics/fournisseurs/list`);
        const data = response.data;
  
        dispatch(setFournisseursList(data.fournisseursList));
      } catch (error) {
        console.error('Erreur lors de la récupération de la liste des fournisseurs :', error);
      }
    };
};
export const setFournisseurStatistics = (statistics, fournisseur) => ({
  type: SET_FOURNISSEUR_STATISTICS,
  payload: { statistics, fournisseur },
});
export const fetchStatisticsForFournisseur = (fournisseur) => {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}api/statistics/fournisseurs/${fournisseur}`);
      const data = response.data;

      dispatch(setFournisseurStatistics(data, fournisseur));
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques pour le fournisseur ${fournisseur} :`, error);
    }
  };
};


// États
export const setEtatsList = (etatsList) => ({
    type: SET_ETATS_LIST,
    payload: etatsList,
});
export const fetchEtatsList = () => {
    return async (dispatch) => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}api/statistics/etats/list`);
        const data = response.data;
  
        dispatch(setEtatsList(data.etatsList));
      } catch (error) {
        console.error('Erreur lors de la récupération de la liste des états :', error);
      }
    };
};
export const setEtatStatistics = (statistics, etat) => ({
  type: SET_ETAT_STATISTICS,
  payload: { statistics, etat },
});
export const fetchStatisticsForEtat = (etat) => {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}api/statistics/etats/${etat}`);
      const data = response.data;

      dispatch(setEtatStatistics(data, etat));
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques pour le fournisseur ${etat} :`, error);
    }
  };
};