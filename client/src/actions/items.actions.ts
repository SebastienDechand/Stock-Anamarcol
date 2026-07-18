import axios from "axios";
import type { AppDispatch, FetchItemsParams } from "../types";

export const GET_ALL_ITEMS = "GET_ALL_ITEMS";
export const FETCH_ITEMS_REQUEST = "FETCH_ITEMS_REQUEST";
export const FETCH_ITEMS_SUCCESS = "FETCH_ITEMS_SUCCESS";
export const FETCH_ITEMS_FAILURE = "FETCH_ITEMS_FAILURE";

// Loads ALL items (used by stats, etc.)
export const getAllItems = () => {
  return (dispatch: AppDispatch) => {
    return axios
      .get(`${import.meta.env.VITE_API_URL}api/item/?limit=9999`)
      .then((res) => {
        const data = res.data;
        const items = Array.isArray(data) ? data : data.items || [];
        dispatch({ type: GET_ALL_ITEMS, payload: items });
      })
      .catch((err) => console.error(err));
  };
};

// Loads items with pagination and server-side filters
export const fetchItems = (params: FetchItemsParams = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch({ type: FETCH_ITEMS_REQUEST });

    try {
      const q = new URLSearchParams();
      if (params.page) q.append("page", params.page.toString());
      if (params.limit) q.append("limit", params.limit.toString());
      if (params.search) q.append("search", params.search);
      if (params.supplier?.length)
        q.append("supplier", params.supplier.join(","));
      if (params.status?.length) q.append("status", params.status.join(","));
      if (params.cgKit) q.append("cgKit", "true");
      if (params.tpvKit) q.append("tpvKit", "true");
      if (params.sortBy) q.append("sortBy", params.sortBy);
      if (params.sortOrder) q.append("sortOrder", params.sortOrder);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}api/item/?${q.toString()}`,
      );

      dispatch({ type: FETCH_ITEMS_SUCCESS, payload: res.data });
    } catch (err) {
      console.error(err);
      dispatch({ type: FETCH_ITEMS_FAILURE });
    }
  };
};
