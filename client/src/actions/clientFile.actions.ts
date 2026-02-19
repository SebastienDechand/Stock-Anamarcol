import axios from "axios";
import type { ClientFileForm, AppDispatch } from "../types";

export const GET_ALL_CLIENT_FILES = "GET_ALL_CLIENT_FILES";
export const GET_CLIENT_FILE = "GET_CLIENT_FILE";
export const SET_SELECTED_CLIENT_FILE = "SET_SELECTED_CLIENT_FILE";
export const CREATE_CLIENT_FILE = "CREATE_CLIENT_FILE";
export const UPDATE_CLIENT_FILE = "UPDATE_CLIENT_FILE";
export const DELETE_CLIENT_FILE = "DELETE_CLIENT_FILE";

const BASE = () => `${import.meta.env.VITE_API_URL}api/client-files`;

export const getAllClientFiles = () => (dispatch: AppDispatch) =>
  axios
    .get(BASE(), { withCredentials: true })
    .then((res) => dispatch({ type: GET_ALL_CLIENT_FILES, payload: res.data }))
    .catch((err) => console.error("getAllClientFiles:", err));

export const getClientFile = (id: string) => (dispatch: AppDispatch) =>
  axios
    .get(`${BASE()}/${id}`, { withCredentials: true })
    .then((res) => dispatch({ type: GET_CLIENT_FILE, payload: res.data }))
    .catch((err) => console.error("getClientFile:", err));

export const setSelectedClientFile = (
  file: import("../types").ClientFile | null,
) => ({
  type: SET_SELECTED_CLIENT_FILE,
  payload: file,
});

export const createClientFile =
  (data: ClientFileForm) => (dispatch: AppDispatch) =>
    axios
      .post(BASE(), data, { withCredentials: true })
      .then((res) => {
        dispatch(
          getAllClientFiles() as unknown as Parameters<typeof dispatch>[0],
        );
        return res.data;
      })
      .catch((err) => {
        console.error("createClientFile:", err);
        throw err;
      });

export const updateClientFile =
  (id: string, data: Partial<ClientFileForm>) => (dispatch: AppDispatch) =>
    axios
      .put(`${BASE()}/${id}`, data, { withCredentials: true })
      .then((res) => {
        dispatch({ type: UPDATE_CLIENT_FILE, payload: res.data });
        dispatch(
          getAllClientFiles() as unknown as Parameters<typeof dispatch>[0],
        );
        return res.data;
      })
      .catch((err) => {
        console.error("updateClientFile:", err);
        throw err;
      });

export const deleteClientFile = (id: string) => (dispatch: AppDispatch) =>
  axios
    .delete(`${BASE()}/${id}`, { withCredentials: true })
    .then(() => {
      dispatch({ type: DELETE_CLIENT_FILE, payload: id });
      dispatch(
        getAllClientFiles() as unknown as Parameters<typeof dispatch>[0],
      );
    })
    .catch((err) => {
      console.error("deleteClientFile:", err);
      throw err;
    });
