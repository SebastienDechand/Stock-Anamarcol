import axios from "axios";

export const GET_USER = "GET_USER"
export const UPLOAD_PICTURE = "UPLOAD_PICTURE"
export const UPDATE_NUMERO = "UPDATE_NUMERO"

export const getUser = (uid) => {
    return (dispatch) => {
        return axios 
            .get(`${process.env.REACT_APP_API_URL}api/user/${uid}`)
            .then((res) => {
                dispatch({type: GET_USER, payload: res.data})
            })
            .catch((err) => console.log(err))
    }
}

export const uploadPicture = (data, id) => {
    const errorMsgProfil = document.querySelector('.error-message-profil')
    return (dispatch) => {
        return axios
            .post(`${process.env.REACT_APP_API_URL}api/user/upload`, data)
            .then((res) => {
                return axios
                    .get(`${process.env.REACT_APP_API_URL}api/user/${id}`)
                    .then((res) => {
                        dispatch({type: UPLOAD_PICTURE, payload: res.data.picture})
                    })
            })
            .catch((err) => {
                if (err.response.data.errors.format) {
                    errorMsgProfil.innerHTML = err.response.data.errors.format
                }
                if (err.response.data.errors.maxSize) {
                    errorMsgProfil.innerHTML = err.response.data.errors.maxSize
                }
            })
    }
}

export const updateNumero = (userId, numero) => {
    return(dispatch) => {
        return axios({
            method: "put",
            url: `${process.env.REACT_APP_API_URL}api/user/` + userId,
            data: {numero},
            withCredentials: true
        })
        .then((res) => {
            dispatch({type: UPDATE_NUMERO, payload:numero})
        })
        .catch((err) => console.log(err))
    }
}