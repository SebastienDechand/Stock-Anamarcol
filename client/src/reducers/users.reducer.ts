import { GET_ALL_USERS } from "../actions/users.actions";
import {
  UPDATE_USER,
  UPLOAD_PROFILE_PICTURE,
} from "../actions/userClient.actions";
import type { User, ReduxAction } from "../types";

const initialState: User[] = [];

export default function usersReducer(
  state: User[] = initialState,
  action: ReduxAction,
): User[] {
  switch (action.type) {
    case GET_ALL_USERS:
      return action.payload as User[];
    case UPDATE_USER: {
      const payload = action.payload as {
        id: string;
        updatedInfo: Record<string, unknown>;
      };
      return state.map((u) =>
        u._id === payload.id
          ? { ...u, ...(payload.updatedInfo as Partial<User>) }
          : u,
      );
    }
    case UPLOAD_PROFILE_PICTURE: {
      const updated = action.payload as Partial<User> | undefined;
      if (!updated || !updated._id) return state;
      return state.map((u) =>
        u._id === updated._id ? { ...u, ...(updated as User) } : u,
      );
    }
    default:
      return state;
  }
}
