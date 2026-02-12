import axios from "axios";

export const GET_ALL_USERS = "GET_ALL_USERS"

export const getAllUsers = () => {
    return (dispatch) => {
        return axios
            .get(`${import.meta.env.VITE_API_URL}api/user/`)
            .then((res) => {
                dispatch({type: GET_ALL_USERS, payload: res.data})
            })
            .catch((err) => console.log(err))
    }
}