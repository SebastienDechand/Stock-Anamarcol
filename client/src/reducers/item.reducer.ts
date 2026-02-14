import {
  ADD_ITEM_SUCCESS,
  DELETE_ITEM_SUCCESS,
  SET_SELECTED_ITEM_QUANTITE,
  SET_SELECTED_ITEM_INFO,
  UPDATE_QUANTITE,
  UPDATE_QUANTITE_SUCCESS,
  SET_MODIFIER_NAME,
  SET_SELECTED_ITEM_ID,
  UPLOAD_ITEM_PICTURE,
  FETCH_HISTORY_REQUEST,
  FETCH_HISTORY_SUCCESS,
  FETCH_HISTORY_FAILURE,
} from "../actions/item.actions";
import type { History, Item, ItemState, ReduxAction } from "../types";

const initialState: ItemState = {
  selectedItemId: null,
  items: [],
  selectedItemQuantite: null,
  selectedItemInfo: null,
  history: [],
  isLoadingHistory: false,
};

export default function itemReducer(
  state = initialState,
  action: ReduxAction,
): ItemState {
  switch (action.type) {
    case ADD_ITEM_SUCCESS:
      return {
        ...state,
        items: [...state.items, action.payload as Item],
      };

    case DELETE_ITEM_SUCCESS: {
      const { itemId } = action.payload as { itemId: string };
      return {
        ...state,
        items: state.items.filter((item) => item._id !== itemId),
      };
    }

    case SET_SELECTED_ITEM_ID: {
      const payload = action.payload as Item | null;
      return {
        ...state,
        selectedItemId: payload ? payload._id : null,
        selectedItemInfo: payload || null,
        history: [],
        isLoadingHistory: false,
      };
    }

    case UPLOAD_ITEM_PICTURE: {
      const payload = action.payload as { image: string; modifierId: string };
      return {
        ...state,
        selectedItemInfo: state.selectedItemInfo
          ? {
              ...state.selectedItemInfo,
              image: payload.image,
            }
          : null,
      };
    }

    case SET_SELECTED_ITEM_QUANTITE:
      return {
        ...state,
        selectedItemQuantite: action.payload as number | null,
      };

    case SET_MODIFIER_NAME:
      return {
        ...state,
        selectedItemInfo: state.selectedItemInfo
          ? {
              ...state.selectedItemInfo,
              modifierName: action.payload as string,
            }
          : null,
      };

    case SET_SELECTED_ITEM_INFO:
      return {
        ...state,
        selectedItemInfo: action.payload as Item | null,
      };

    case UPDATE_QUANTITE: {
      const { itemId: uid, quantite } = action.payload as {
        itemId: string;
        quantite: number;
      };
      return {
        ...state,
        items: state.items.map((item) => {
          if (item._id === uid) {
            return { ...item, quantite };
          }
          return item;
        }),
        selectedItemQuantite:
          state.selectedItemId === uid ? quantite : state.selectedItemQuantite,
        selectedItemInfo: state.selectedItemInfo
          ? {
              ...state.selectedItemInfo,
              quantite:
                state.selectedItemId === uid
                  ? quantite
                  : state.selectedItemInfo.quantite,
            }
          : null,
      };
    }

    case UPDATE_QUANTITE_SUCCESS: {
      const { updatedItemId, updatedQuantite, modifierName, operation } =
        action.payload as {
          updatedItemId: string;
          updatedQuantite: number;
          modifierName: string;
          operation: string;
        };
      return {
        ...state,
        items: state.items.map((item) => {
          if (item._id === updatedItemId) {
            return {
              ...item,
              quantite:
                operation === "increment"
                  ? item.quantite + 1
                  : item.quantite - 1,
              modifierName,
            };
          }
          return item;
        }),
        selectedItemQuantite: updatedQuantite,
        selectedItemInfo: state.selectedItemInfo
          ? {
              ...state.selectedItemInfo,
              quantite: updatedQuantite,
              modifierName,
            }
          : null,
      };
    }

    case FETCH_HISTORY_REQUEST:
      return {
        ...state,
        isLoadingHistory: true,
      };

    case FETCH_HISTORY_SUCCESS:
      return {
        ...state,
        history: action.payload as History[],
        isLoadingHistory: false,
      };

    case FETCH_HISTORY_FAILURE:
      return {
        ...state,
        isLoadingHistory: false,
      };

    default:
      return state;
  }
}
