import axios from "axios";

export const GET_ALL_ITEMS = "GET_ALL_ITEMS"

export const getAllItems = () => {
    return (dispatch) => {
        return axios
            .get(`${process.env.REACT_APP_API_URL}api/item/`)
            .then((res) => {
                dispatch({type: GET_ALL_ITEMS, payload: res.data})
            })
            .catch((err) => console.log(err))
    }
} 