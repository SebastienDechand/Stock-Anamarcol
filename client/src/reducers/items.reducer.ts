import {
  GET_ALL_ITEMS,
  FETCH_ITEMS_REQUEST,
  FETCH_ITEMS_SUCCESS,
  FETCH_ITEMS_FAILURE,
} from "../actions/items.actions";
import {
  UPDATE_QUANTITE_SUCCESS,
  DELETE_ITEM_SUCCESS,
} from "../actions/item.actions";
import type { Item, ItemsState, ReduxAction } from "../types";

const initialState: ItemsState = {
  allItems: [],
  items: [],
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: false,
};

export default function itemsReducer(
  state = initialState,
  action: ReduxAction,
): ItemsState {
  switch (action.type) {
    case GET_ALL_ITEMS:
      return {
        ...state,
        allItems: action.payload as Item[],
      };

    case FETCH_ITEMS_REQUEST:
      return {
        ...state,
        isLoading: true,
      };

    case FETCH_ITEMS_SUCCESS: {
      const { items, total, page, totalPages } = action.payload as {
        items: Item[];
        total: number;
        page: number;
        totalPages: number;
      };
      return {
        ...state,
        items,
        total,
        page,
        totalPages,
        isLoading: false,
      };
    }

    case FETCH_ITEMS_FAILURE:
      return {
        ...state,
        isLoading: false,
      };

    case UPDATE_QUANTITE_SUCCESS: {
      const { updatedItemId, updatedQuantite } = action.payload as {
        updatedItemId: string;
        updatedQuantite: number;
      };
      return {
        ...state,
        items: state.items.map((item) =>
          item._id === updatedItemId
            ? { ...item, quantite: updatedQuantite }
            : item,
        ),
      };
    }

    case DELETE_ITEM_SUCCESS: {
      const { itemId } = action.payload as { itemId: string };
      return {
        ...state,
        items: state.items.filter((item) => item._id !== itemId),
        total: state.total - 1,
      };
    }

    default:
      return state;
  }
}
