import { 
  ADD_ITEM_SUCCESS, DELETE_ITEM_SUCCESS,
  SET_SELECTED_ITEM_QUANTITE, 
  SET_SELECTED_ITEM_INFO, 
  UPDATE_QUANTITE, 
  UPDATE_QUANTITE_SUCCESS,
  SET_MODIFIER_NAME,
  SET_SELECTED_ITEM_ID, 
  UPLOAD_ITEM_PICTURE, 
  } from '../actions/item.actions';

const initialState = {
  selectedItemId: null,
  items: [],
  selectedItemQuantite: null,
  selectedItemInfo: null,
};

export default function itemReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_ITEM_SUCCESS:
      return {
        ...state,
        items: [...state.items, action.payload],
      };

    case DELETE_ITEM_SUCCESS:
      return {
        ...state,
        items: state.items.filter(item => item._id !== action.payload.itemId),
      };

    case SET_SELECTED_ITEM_ID:
      return {
        ...state,
        selectedItemId: action.payload ? action.payload._id : null,
        selectedItemInfo: action.payload || null,
      };

    case UPLOAD_ITEM_PICTURE:
      return {
        ...state,
        selectedItemInfo: {
          ...state.selectedItemInfo,
          image: action.payload.image,
          modifierId: action.payload.modifierId,
        },
      };

    case SET_SELECTED_ITEM_QUANTITE:
      return {
        ...state,
        selectedItemQuantite: action.payload,
      };

    case SET_MODIFIER_NAME:
      return {
        ...state,
        selectedItemInfo: {
          ...state.selectedItemInfo,
          modifierName: action.payload,
        },
      };

    case SET_SELECTED_ITEM_INFO:
      return {
        ...state,
        selectedItemInfo: action.payload,
      };

    case UPDATE_QUANTITE:
      const { itemId, quantite } = action.payload;
      return {
        ...state,
        items: state.items.map(item => {
          if (item._id === itemId) {
            return {
              ...item,
              quantite: quantite,
            };
          }
          return item;
        }),
        selectedItemQuantite: state.selectedItemId === itemId ? quantite : state.selectedItemQuantite,
        selectedItemInfo: { 
          ...state.selectedItemInfo, 
          quantite: state.selectedItemId === itemId ? quantite : state.selectedItemQuantite,
        },
    };

    case UPDATE_QUANTITE_SUCCESS:
      const { updatedItemId, updatedQuantite, modifierName, operation } = action.payload;
      return {
        ...state,
        items: state.items.map(item => {
          if (item._id === updatedItemId) {
            return {
              ...item,
              quantite: operation === 'increment' ? item.quantite + 1 : item.quantite - 1,
              modifierName: modifierName,
            };
          }
          return item;
        }),
        selectedItemQuantite: updatedQuantite,
        selectedItemInfo: {
          ...state.selectedItemInfo,
          quantite: updatedQuantite,
          modifierName: modifierName, 
        },
      };   

    default:
      return state;
  }
}
