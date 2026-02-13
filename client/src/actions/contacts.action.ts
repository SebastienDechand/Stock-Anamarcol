import axios from "axios";
import type { Contact, ReduxAction, AppDispatch } from "../types";

export const GET_CONTACT = "GET_CONTACT";
export const GET_ALL_CONTACTS = "GET_ALL_CONTACTS";
export const SET_SELECTED_CONTACT_ID = "SET_SELECTED_CONTACT_ID";
export const UPLOAD_CONTACT_PICTURE = "UPLOAD_CONTACT_PICTURE";
export const SET_SELECTED_CONTACT_INFO = "SET_SELECTED_CONTACT_INFO";
export const UPDATE_CONTACT = "UPDATE_CONTACT";

export const getContact = (id: string) => {
  return (dispatch: AppDispatch) => {
    return axios
      .get(`${import.meta.env.VITE_API_URL}api/contacts/${id}`)
      .then((res) => {
        dispatch({ type: GET_CONTACT, payload: res.data });
      })
      .catch((err) => console.error(err));
  };
};

export const getAllContacts = () => {
  return (dispatch: AppDispatch) => {
    return axios
      .get(`${import.meta.env.VITE_API_URL}api/contacts/`)
      .then((res) => {
        dispatch({ type: GET_ALL_CONTACTS, payload: res.data });
      })
      .catch((err) => console.error(err));
  };
};

export const setSelectedContactId = (contactId: string | null) => {
  return async (dispatch: AppDispatch) => {
    try {
      if (contactId === null) {
        dispatch({ type: SET_SELECTED_CONTACT_ID, payload: null });
      } else {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/contacts/${contactId}`,
        );
        dispatch({ type: SET_SELECTED_CONTACT_ID, payload: response.data });
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations de l'article",
        error,
      );
    }
  };
};

export const uploadContactPicture = (data: FormData, id: string) => {
  return (dispatch: AppDispatch) => {
    return axios
      .post(`${import.meta.env.VITE_API_URL}api/contacts/upload`, data)
      .then(() => {
        return axios
          .get(`${import.meta.env.VITE_API_URL}api/contacts/${id}`)
          .then((res) => {
            dispatch({
              type: UPLOAD_CONTACT_PICTURE,
              payload: res.data.picture,
            });
            dispatch(getAllContacts());
          });
      })
      .catch((err) => {
        console.error("Upload contact error:", err);
        throw err;
      });
  };
};

export const setSelectedContactInfo = (
  itemInfo: Contact | null,
): ReduxAction => ({
  type: SET_SELECTED_CONTACT_INFO,
  payload: itemInfo,
});

export const updateContact = (
  contactId: string,
  updatedInfo: Partial<Contact>,
) => {
  return (dispatch: AppDispatch) => {
    return axios({
      method: "put",
      url: `${import.meta.env.VITE_API_URL}api/contacts/` + contactId,
      data: updatedInfo,
      withCredentials: true,
    })
      .then(() => {
        dispatch({ type: UPDATE_CONTACT, payload: updatedInfo });
      })
      .catch((err) => console.error(err));
  };
};
