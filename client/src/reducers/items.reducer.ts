import { GET_ALL_ITEMS } from "../actions/items.actions";
import type { Item, ItemsState, ReduxAction } from "../types";

const initialState: ItemsState = {
  items: [],
};

export default function itemsReducer(
  state = initialState,
  action: ReduxAction,
): ItemsState {
  switch (action.type) {
    case GET_ALL_ITEMS:
      return {
        ...state,
        items: action.payload as Item[],
      };

    default:
      return state;
  }
}
