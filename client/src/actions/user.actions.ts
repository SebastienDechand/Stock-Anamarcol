import axios from "axios";
import type { AppDispatch } from "../types";

export const GET_USER = "GET_USER";
export const UPLOAD_PICTURE = "UPLOAD_PICTURE";
export const UPDATE_NUMERO = "UPDATE_NUMERO";

export const getUser = (uid: string) => {
  return (dispatch: AppDispatch) => {
    return axios
      .get(`${import.meta.env.VITE_API_URL}api/user/${uid}`)
      .then((res) => {
        dispatch({ type: GET_USER, payload: res.data });
      })
      .catch((err) => console.error(err));
  };
};

export const uploadPicture = (data: FormData, id: string) => {
  return (dispatch: AppDispatch) => {
    return axios
      .post(`${import.meta.env.VITE_API_URL}api/user/upload`, data)
      .then(() => {
        return axios
          .get(`${import.meta.env.VITE_API_URL}api/user/${id}`)
          .then((res) => {
            dispatch({ type: UPLOAD_PICTURE, payload: res.data.picture });
          });
      })
      .catch((err) => {
        console.error("Upload profil error:", err);
        throw err;
      });
  };
};

export const updateNumero = (userId: string, numero: string) => {
  return (dispatch: AppDispatch) => {
    return axios({
      method: "put",
      url: `${import.meta.env.VITE_API_URL}api/user/` + userId,
      data: { numero },
      withCredentials: true,
    })
      .then(() => {
        dispatch({ type: UPDATE_NUMERO, payload: numero });
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  };
};
