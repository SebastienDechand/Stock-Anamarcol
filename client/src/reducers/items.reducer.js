import { GET_ALL_ITEMS } from '../actions/items.actions';

const initialState = {
  items: [],
};

export default function itemsReducer(state = initialState, action) {
  switch (action.type) {
    case GET_ALL_ITEMS:
      return {
        ...state,
        items: action.payload,
      };

    default:
      return state;
  }
}
