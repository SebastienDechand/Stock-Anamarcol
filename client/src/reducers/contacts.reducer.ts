import {
  GET_CONTACT,
  GET_ALL_CONTACTS,
  SET_SELECTED_CONTACT_ID,
  UPLOAD_CONTACT_PICTURE,
  SET_SELECTED_CONTACT_INFO,
  UPDATE_CONTACT,
} from "../actions/contacts.action";
import type { ContactsState, ReduxAction } from "../types";

const initialState: ContactsState = {
  selectedContactId: null,
  selectedContactInfo: null,
  contactsData: [],
};

export default function contactsReducer(
  state = initialState,
  action: ReduxAction,
): ContactsState {
  switch (action.type) {
    case GET_CONTACT:
      return {
        ...state,
        contactsData: [action.payload as ContactsState["contactsData"][0]],
      };
    case GET_ALL_CONTACTS:
      return {
        ...state,
        contactsData: action.payload as ContactsState["contactsData"],
      };
    case SET_SELECTED_CONTACT_ID: {
      const payload = action.payload as { _id: string } | null;
      return {
        ...state,
        selectedContactId: payload ? payload._id : null,
        selectedContactInfo: payload || null,
      };
    }
    case UPLOAD_CONTACT_PICTURE:
      return {
        ...state,
        picture: action.payload as string,
      };
    case SET_SELECTED_CONTACT_INFO:
      return {
        ...state,
        selectedContactInfo:
          action.payload as ContactsState["selectedContactInfo"],
      };
    case UPDATE_CONTACT:
      return {
        ...state,
        numero: action.payload as string,
      };
    default:
      return state;
  }
}
