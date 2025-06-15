import axios from "axios";
import { getAllItems } from "./items.actions";
import { fetchArticlesWithLowStock, fetchStatisticsForEtat, fetchStatisticsForFournisseur } from "./statistics.actions";

export const ADD_ITEM_SUCCESS = "ADD_ITEM_SUCCESS";
export const ADD_ITEM_FAILURE = "ADD_ITEM_FAILURE";
export const DELETE_ITEM_SUCCESS = "DELETE_ITEM_SUCCESS";
export const DELETE_ITEM_FAILURE = "DELETE_ITEM_FAILURE";
export const SET_SELECTED_ITEM_QUANTITE = 'SET_SELECTED_ITEM_QUANTITE';
export const SET_SELECTED_ITEM_INFO = "SET_SELECTED_ITEM_INFO"
export const UPDATE_QUANTITE = "UPDATE_QUANTITE"
export const UPDATE_QUANTITE_SUCCESS = "UPDATE_QUANTITE_SUCCESS"
export const SET_MODIFIER_NAME = 'SET_MODIFIER_NAME'
export const SET_SELECTED_ITEM_ID = "SET_SELECTED_ITEM_ID"
export const UPLOAD_ITEM_PICTURE = "UPLOAD_ITEM_PICTURE"

export const addItem = (newItem) => {
  const errorArticle = document.querySelector('.article-error');
  return async (dispatch) => {
    try {
      // Vérifie si des articles avec la même dénomination existent
      const existingItems = await axios.get(`${process.env.REACT_APP_API_URL}api/item/?denomination=${newItem.denomination}`);
      // Parcourez les articles existants pour trouver ceux avec le même fournisseur et état
      const sameItems = existingItems.data.filter((item) => {
        return item.denomination === newItem.denomination && 
               item.fournisseur === newItem.fournisseur && 
               item.etat === newItem.etat;
      });    

      if (sameItems.length > 0) {
        // Si des articles avec la même dénomination, fournisseur et état existent, affiche un message d'erreur
        errorArticle.innerHTML = "Un article avec la même dénomination, fournisseur et état existe déjà.";
        return; // Arrête le traitement car un article avec les mêmes paramètres existe déjà
      }

      // Si aucun article avec les mêmes paramètres n'existe, créez le nouvel article
      const res = await axios.post(`${process.env.REACT_APP_API_URL}api/item/`, newItem);
      
      dispatch({
        type: ADD_ITEM_SUCCESS,
        payload: res.data.item,
      });
      
      // Met à jour les statistiques du fournisseur après la création de l'article
      dispatch(fetchStatisticsForFournisseur(newItem.fournisseur));
      dispatch(fetchStatisticsForEtat(newItem.etat));
      dispatch(fetchArticlesWithLowStock());
      dispatch(getAllItems());
      errorArticle.innerHTML = ''
    } catch (err) {
      // Gère les erreurs
      if (err.response.data.errors) {
        const errors = err.response.data.errors;
        if (errors.denomination) {
          errorArticle.innerHTML = errors.denomination;
        }
        if (errors.fournisseur) {
          errorArticle.innerHTML = errors.fournisseur;
        }
        if (errors.etat) {
          errorArticle.innerHTML = errors.etat;
        }
        if (errors.quantite) {
          errorArticle.innerHTML = errors.quantite;
        }
      } else {
        console.error(err);
      }
    }
  };
};

export const setSelectedItemQuantite = (quantite) => ({
  type: SET_SELECTED_ITEM_QUANTITE,
  payload: quantite,
});

export const setSelectedItemInfo = (itemInfo) => ({
  type: SET_SELECTED_ITEM_INFO,
  payload: itemInfo,
});

export const updateQuantite = (itemId, newQuantite, modifierName, operation) => {
  return (dispatch) => {
    const numericQuantite = parseInt(newQuantite, 10);

    return axios({
      method: "put",
      url: `${process.env.REACT_APP_API_URL}api/item/${itemId}`,
      data: { quantite: numericQuantite, modifierName, operation },
      withCredentials: true,
    })
      .then((res) => {
        dispatch({
          type: UPDATE_QUANTITE_SUCCESS,
          payload: { updatedItemId: itemId, updatedQuantite: numericQuantite, modifierName, operation },
        });

        dispatch(fetchArticlesWithLowStock());
        dispatch(getAllItems());
      })
      .catch((err) => console.log(err));
  };
};

export const setModifierName = (modifierName) => ({
  type: SET_MODIFIER_NAME,
  payload: modifierName,
});
export const updateQuantiteSuccess = (updatedItemId, updatedQuantite, modifierName, operation ) => ({
  type: UPDATE_QUANTITE_SUCCESS,
  payload: { updatedItemId, updatedQuantite, modifierName, operation  },
});

export const setSelectedItemId = (itemId) => {
    return async (dispatch) => {
      try {
        if (itemId === null) {
          dispatch({ type: SET_SELECTED_ITEM_ID, payload: null });
        } else {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}api/item/${itemId}`);
          dispatch({ type: SET_SELECTED_ITEM_ID, payload: response.data });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des informations de l'article", error);
      }
    };
};

export const uploadItemPicture = (data, id, modifierId) => {
  const errorMsg = document.querySelector('.error-message')
  return (dispatch) => {
    data.append("modifierId", modifierId);

    return axios
      .post(`${process.env.REACT_APP_API_URL}api/item/upload`, data)
      .then((res) => {
        return axios
          .get(`${process.env.REACT_APP_API_URL}api/item/${id}`)
          .then((res) => {
            dispatch({ type: UPLOAD_ITEM_PICTURE, payload: res.data.image });
            dispatch(getAllItems());
          });
      })
      .catch((err) => {
        if (err.response.data.errors.format) {
          errorMsg.innerHTML = err.response.data.errors.format
        }
        if (err.response.data.errors.maxSize) {
        errorMsg.innerHTML = err.response.data.errors.maxSize
        }
      })
  };
};

export const deleteItem = (itemId, fournisseur, etat) => {
  return async (dispatch) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}api/item/${itemId}`);

      dispatch({
        type: DELETE_ITEM_SUCCESS,
        payload: { itemId },
      });
      // Met à jour les statistiques du fournisseur après la suppression de l'article
      dispatch(fetchStatisticsForFournisseur(fournisseur));
      dispatch(fetchStatisticsForEtat(etat));
      dispatch(fetchArticlesWithLowStock());
      dispatch(getAllItems());
    } catch (error) {
      console.error("Erreur lors de la suppression de l'article", error);
      dispatch({
        type: DELETE_ITEM_FAILURE,
        payload: error.message || 'Une erreur s\'est produite lors de la suppression de l\'article.',
      });
    }
  };
};
