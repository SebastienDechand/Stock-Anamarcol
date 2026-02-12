import axios from "axios";
import type { AppDispatch } from "../types";

export const GET_ALL_ITEMS = "GET_ALL_ITEMS";

export const getAllItems = () => {
  return (dispatch: AppDispatch) => {
    return axios
      .get(`${import.meta.env.VITE_API_URL}api/item/?limit=9999`)
      .then((res) => {
        const data = res.data;
        // Support both paginated { items } and flat array responses
        const items = Array.isArray(data) ? data : data.items || [];
        dispatch({ type: GET_ALL_ITEMS, payload: items });
      })
      .catch((err) => console.error(err));
  };
};
