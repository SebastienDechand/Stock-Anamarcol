import axios from "axios";
import type { AppDispatch } from "../types";

export const GET_ALL_USERS = "GET_ALL_USERS";

export const ADD_USER = "ADD_USER";
export const DELETE_USER = "DELETE_USER";

export const getAllUsers = () => {
  return (dispatch: AppDispatch) => {
    return axios
      .get(`${import.meta.env.VITE_API_URL}api/user/`)
      .then((res) => {
        dispatch({ type: GET_ALL_USERS, payload: res.data });
      })
      .catch((err) => console.error(err));
  };
};

export const addUser = (data: {
  pseudo: string;
  email: string;
  password: string;
  poste?: string;
  numero?: string;
  pole?: string;
}) => {
  return (dispatch: AppDispatch) => {
    return axios
      .post(`${import.meta.env.VITE_API_URL}api/user/register`, data, {
        withCredentials: true,
      })
      .then(() => dispatch(getAllUsers()))
      .catch((err) => {
        console.error(err);
        throw err;
      });
  };
};

export const deleteUser = (id: string) => {
  return (dispatch: AppDispatch) => {
    return axios
      .delete(`${import.meta.env.VITE_API_URL}api/user/` + id, {
        withCredentials: true,
      })
      .then(() => dispatch(getAllUsers()))
      .catch((err) => {
        console.error(err);
        throw err;
      });
  };
};
