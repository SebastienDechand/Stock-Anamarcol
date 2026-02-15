import axios from "axios";
import type { AppDispatch } from "../types";

export const UPLOAD_PROFILE_PICTURE = "UPLOAD_PROFILE_PICTURE";
export const UPDATE_USER = "UPDATE_USER";

export const uploadProfilePicture = (data: FormData) => {
  return (dispatch: AppDispatch) => {
    return axios
      .post(`${import.meta.env.VITE_API_URL}api/user/upload`, data, {
        withCredentials: true,
      })
      .then((res) => {
        dispatch({ type: UPLOAD_PROFILE_PICTURE, payload: res.data });
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  };
};

export const updateUser = (
  id: string,
  updatedInfo: Record<string, unknown>,
) => {
  return (dispatch: AppDispatch) => {
    return axios({
      method: "put",
      url: `${import.meta.env.VITE_API_URL}api/user/` + id,
      data: updatedInfo,
      withCredentials: true,
    })
      .then((res) => {
        dispatch({ type: UPDATE_USER, payload: { id, updatedInfo } });
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  };
};
