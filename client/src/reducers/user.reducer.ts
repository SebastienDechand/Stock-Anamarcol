import {
  GET_USER,
  UPDATE_NUMERO,
  UPLOAD_PICTURE,
} from "../actions/user.actions";
import type { User, ReduxAction } from "../types";

const initialState: Partial<User> = {};

export default function userReducer(
  state = initialState,
  action: ReduxAction,
): Partial<User> {
  switch (action.type) {
    case GET_USER:
      return action.payload as User;
    case UPLOAD_PICTURE:
      return {
        ...state,
        picture: action.payload as string,
      };
    case UPDATE_NUMERO:
      return {
        ...state,
        numero: action.payload as string,
      };
    default:
      return state;
  }
}
