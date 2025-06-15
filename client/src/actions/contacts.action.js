import axios from "axios";

export const GET_CONTACT = "GET_CONTACT"
export const GET_ALL_CONTACTS = "GET_ALL_CONTACTS"
export const SET_SELECTED_CONTACT_ID = 'SET_SELECTED_CONTACT_ID'
export const UPLOAD_CONTACT_PICTURE = "UPLOAD_CONTACT_PICTURE"
export const SET_SELECTED_CONTACT_INFO = "SET_SELECTED_CONTACT_INFO"
export const UPDATE_CONTACT = "UPDATE_CONTACT"

export const getContact = (id) => {
    return (dispatch) => {
        return axios 
            .get(`${process.env.REACT_APP_API_URL}api/contacts/${id}`)
            .then((res) => {
                dispatch({type: GET_CONTACT, payload: res.data})
            })
            .catch((err) => console.log(err))
    }
}

export const getAllContacts = () => {
    return (dispatch) => {
        return axios
            .get(`${process.env.REACT_APP_API_URL}api/contacts/`)
            .then((res) => {
                dispatch({type: GET_ALL_CONTACTS, payload: res.data})
            })
            .catch((err) => console.log(err))
    }
}

export const setSelectedContactId = (contactId) => {
    return async (dispatch) => {
      try {
        if (contactId === null) {
          dispatch({ type: SET_SELECTED_CONTACT_ID, payload: null });
        } else {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}api/contacts/${contactId}`);
          dispatch({ type: SET_SELECTED_CONTACT_ID, payload: response.data });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des informations de l'article", error);
      }
    };
};

export const uploadContactPicture = (data, id) => {
    const errorMsgContact = document.querySelector('.error-message-contact')
    return (dispatch) => {
        return axios
            .post(`${process.env.REACT_APP_API_URL}api/contacts/upload`, data)
            .then((res) => {
                return axios
                    .get(`${process.env.REACT_APP_API_URL}api/contact/${id}`)
                    .then((res) => {
                        dispatch({type: UPLOAD_CONTACT_PICTURE, payload: res.data.picture})
                        dispatch(getAllContacts())
                    })
            })
            .catch((err) => {
                if (err.response.data.format) {
                    errorMsgContact.innerHTML = err.response.data.format
                }
                if (err.response.data.maxSize) {
                    errorMsgContact.innerHTML = err.response.data.maxSize
                }
            })
    }
}

export const setSelectedContactInfo = (itemInfo) => ({
    type: SET_SELECTED_CONTACT_INFO,
    payload: itemInfo,
  });

export const updateContact = (contactId, updatedInfo) => {
    return (dispatch) => {
        return axios({
            method: "put",
            url: `${process.env.REACT_APP_API_URL}api/contacts/` + contactId,
            data: updatedInfo,
            withCredentials: true
        })
        .then((res) => {
            dispatch({ type: UPDATE_CONTACT, payload: updatedInfo });
        })
        .catch((err) => console.log(err));
    };
};
