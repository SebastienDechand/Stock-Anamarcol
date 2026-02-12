import { GET_ALL_USERS } from "../actions/users.actions";
import type { User, ReduxAction } from "../types";

const initialState: User[] = [];

export default function usersReducer(
  state: User[] = initialState,
  action: ReduxAction,
): User[] {
  switch (action.type) {
    case GET_ALL_USERS:
      return action.payload as User[];
    default:
      return state;
  }
}
