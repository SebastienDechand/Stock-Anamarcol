import axios from "axios";
import toast from "react-hot-toast";
import type { AppDispatch, Item, ReduxAction } from "../types";
import { getAllItems } from "./items.actions";
import {
  fetchArticlesWithLowStock,
  fetchStatisticsForEtat,
  fetchStatisticsForFournisseur,
} from "./statistics.actions";

export const ADD_ITEM_SUCCESS = "ADD_ITEM_SUCCESS";
export const ADD_ITEM_FAILURE = "ADD_ITEM_FAILURE";
export const DELETE_ITEM_SUCCESS = "DELETE_ITEM_SUCCESS";
export const DELETE_ITEM_FAILURE = "DELETE_ITEM_FAILURE";
export const SET_SELECTED_ITEM_QUANTITE = "SET_SELECTED_ITEM_QUANTITE";
export const SET_SELECTED_ITEM_INFO = "SET_SELECTED_ITEM_INFO";
export const UPDATE_QUANTITE = "UPDATE_QUANTITE";
export const UPDATE_QUANTITE_SUCCESS = "UPDATE_QUANTITE_SUCCESS";
export const UPDATE_ITEM_SUCCESS = "UPDATE_ITEM_SUCCESS";
export const SET_MODIFIER_NAME = "SET_MODIFIER_NAME";
export const SET_SELECTED_ITEM_ID = "SET_SELECTED_ITEM_ID";
export const UPLOAD_ITEM_PICTURE = "UPLOAD_ITEM_PICTURE";
export const FETCH_HISTORY_REQUEST = "FETCH_HISTORY_REQUEST";
export const FETCH_HISTORY_SUCCESS = "FETCH_HISTORY_SUCCESS";
export const FETCH_HISTORY_FAILURE = "FETCH_HISTORY_FAILURE";

interface NewItem {
  denomination: string;
  fournisseur: string;
  quantite: number;
  etat: string;
  posterId: string;
  modifierId?: string;
  modifierName?: string;
}

export const addItem = (newItem: NewItem) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}api/item/`,
        newItem,
      );

      dispatch({ type: ADD_ITEM_SUCCESS, payload: res.data.item });
      dispatch(getAllItems());
      toast.success("Article ajouté");
      return res.data.item;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { errors?: Record<string, string> } };
        message?: string;
      };
      const message =
        error.response?.data?.errors?.denomination ||
        error.response?.data?.errors?.fournisseur ||
        error.response?.data?.errors?.etat ||
        error.response?.data?.errors?.quantite ||
        "Erreur lors de l'ajout.";
      dispatch({ type: ADD_ITEM_FAILURE, payload: message });
      throw new Error(message);
    }
  };
};

export const setSelectedItemQuantite = (
  quantite: number | null,
): ReduxAction => ({
  type: SET_SELECTED_ITEM_QUANTITE,
  payload: quantite,
});

export const setSelectedItemInfo = (itemInfo: Item | null): ReduxAction => ({
  type: SET_SELECTED_ITEM_INFO,
  payload: itemInfo,
});

export const updateQuantite = (
  itemId: string,
  newQuantite: number | string,
  modifierName: string,
  operation?: string,
) => {
  return (dispatch: AppDispatch) => {
    const numericQuantite = parseInt(String(newQuantite), 10);

    return axios({
      method: "put",
      url: `${import.meta.env.VITE_API_URL}api/item/${itemId}`,
      data: { quantite: numericQuantite, modifierName, operation },
      withCredentials: true,
    })
      .then(() => {
        dispatch({
          type: UPDATE_QUANTITE_SUCCESS,
          payload: {
            updatedItemId: itemId,
            updatedQuantite: numericQuantite,
            modifierName,
            operation,
          },
        });

        dispatch(fetchArticlesWithLowStock());
        dispatch(getAllItems());
        toast.success(`Quantité mise à jour (${numericQuantite})`);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Erreur lors de la mise à jour de la quantité");
      });
  };
};

export const updateItem = (
  itemId: string,
  fields: {
    denomination?: string;
    fournisseur?: string;
    etat?: string;
    quantite?: number;
    modifierName?: string;
  },
) => {
  return async (dispatch: AppDispatch) => {
    try {
      await axios({
        method: "put",
        url: `${import.meta.env.VITE_API_URL}api/item/${itemId}`,
        data: fields,
        withCredentials: true,
      });

      dispatch({ type: UPDATE_ITEM_SUCCESS, payload: { itemId, ...fields } });
      dispatch(fetchArticlesWithLowStock());
      dispatch(getAllItems());
      toast.success("Article mis à jour");
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'article :", err);
      toast.error("Erreur lors de la mise à jour");
      throw err;
    }
  };
};

export const setModifierName = (modifierName: string): ReduxAction => ({
  type: SET_MODIFIER_NAME,
  payload: modifierName,
});

export const updateQuantiteSuccess = (
  updatedItemId: string,
  updatedQuantite: number | string,
  modifierName: string,
  operation?: string,
): ReduxAction => ({
  type: UPDATE_QUANTITE_SUCCESS,
  payload: { updatedItemId, updatedQuantite, modifierName, operation },
});

export const setSelectedItemId = (itemId: string | null) => {
  return async (dispatch: AppDispatch) => {
    try {
      if (itemId === null) {
        dispatch({ type: SET_SELECTED_ITEM_ID, payload: null });
      } else {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/item/${itemId}`,
        );
        dispatch({ type: SET_SELECTED_ITEM_ID, payload: response.data });
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations de l'article",
        error,
      );
    }
  };
};

export const uploadItemPicture = (
  data: FormData,
  id: string,
  modifierId: string,
) => {
  return (dispatch: AppDispatch) => {
    data.append("modifierId", modifierId);

    return axios
      .post(`${import.meta.env.VITE_API_URL}api/item/upload`, data)
      .then(() => {
        return axios
          .get(`${import.meta.env.VITE_API_URL}api/item/${id}`)
          .then((res) => {
            dispatch({ type: UPLOAD_ITEM_PICTURE, payload: res.data.image });
            dispatch(getAllItems());
          });
      })
      .catch((err) => {
        console.error("Upload error:", err);
        throw err;
      });
  };
};

export const fetchItemHistory = (itemId: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch({ type: FETCH_HISTORY_REQUEST });
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}api/item/history/${itemId}`,
      );
      dispatch({ type: FETCH_HISTORY_SUCCESS, payload: res.data });
    } catch (err) {
      console.error("Erreur lors de la récupération de l'historique :", err);
      dispatch({ type: FETCH_HISTORY_FAILURE });
    }
  };
};

export const deleteItem = (
  itemId: string,
  fournisseur: string,
  etat: string,
) => {
  return async (dispatch: AppDispatch) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}api/item/${itemId}`, {
        withCredentials: true,
      });

      dispatch({
        type: DELETE_ITEM_SUCCESS,
        payload: { itemId },
      });
      dispatch(fetchStatisticsForFournisseur(fournisseur));
      dispatch(fetchStatisticsForEtat(etat));
      dispatch(fetchArticlesWithLowStock());
      dispatch(getAllItems());
      toast.success("Article supprimé");
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Erreur lors de la suppression de l'article", error);
      toast.error("Erreur lors de la suppression");
      dispatch({
        type: DELETE_ITEM_FAILURE,
        payload:
          err.message ||
          "Une erreur s'est produite lors de la suppression de l'article.",
      });
    }
  };
};

export const prepaBatch = (
  prepa: string,
  operation: "increment" | "decrement",
  count: number = 1,
) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}api/item/prepa-batch`,
        { prepa, operation, count },
        { withCredentials: true },
      );
      dispatch(getAllItems());
      const label = prepa === "prepaCG" ? "CashGuard" : "Caisse TPV";
      const op = operation === "increment" ? "remis en stock" : "retiré du stock";
      toast.success(`${label} : ${res.data.updated} articles ${op}`);
      return res.data;
    } catch (err) {
      console.error("Erreur batch prépa:", err);
      toast.error("Erreur lors de l'opération batch prépa");
      throw err;
    }
  };
};
