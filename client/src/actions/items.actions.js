import axios from "axios";

export const GET_ALL_ITEMS = "GET_ALL_ITEMS";

export const getAllItems = () => {
  return (dispatch) => {
    return axios
      .get(`${process.env.REACT_APP_API_URL}api/item/?limit=9999`)
      .then((res) => {
        const data = res.data;
        // Support both paginated { items } and flat array responses
        const items = Array.isArray(data) ? data : data.items || [];
        dispatch({ type: GET_ALL_ITEMS, payload: items });
      })
      .catch((err) => console.log(err));
  };
};
