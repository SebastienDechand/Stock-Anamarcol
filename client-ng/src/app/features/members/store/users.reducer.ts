import { createReducer, on } from '@ngrx/store';
import { UsersActions } from './users.actions';
import { initialUsersState } from './users.state';

export const usersReducer = createReducer(
  initialUsersState,

  on(UsersActions.loadAllUsers, (state) => ({ ...state, isLoading: true })),
  on(UsersActions.loadAllUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loaded: true,
    isLoading: false,
    error: null,
  })),
  on(UsersActions.loadAllUsersFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(UsersActions.deleteUserSuccess, (state, { id }) => ({
    ...state,
    users: state.users.filter((user) => user._id !== id),
  })),

  on(UsersActions.updateUserSuccess, (state, { id, data }) => ({
    ...state,
    users: state.users.map((user) => (user._id === id ? { ...user, ...data } : user)),
  })),

  // Optimistic update
  on(UsersActions.updateRoles, (state, { id, roles }) => ({
    ...state,
    users: state.users.map((user) => (user._id === id ? { ...user, roles } : user)),
    savingRoleIds: [...state.savingRoleIds, id],
  })),
  on(UsersActions.updateRolesSuccess, (state, { id }) => ({
    ...state,
    savingRoleIds: state.savingRoleIds.filter((savingId) => savingId !== id),
  })),
  // Rollback on failure
  on(UsersActions.updateRolesFailure, (state, { id, previousRoles }) => ({
    ...state,
    users: state.users.map((user) => (user._id === id ? { ...user, roles: previousRoles } : user)),
    savingRoleIds: state.savingRoleIds.filter((savingId) => savingId !== id),
  })),

  on(UsersActions.uploadPictureSuccess, (state, { user }) => ({
    ...state,
    users: state.users.map((existingUser) =>
      existingUser._id === user._id ? { ...existingUser, ...user } : existingUser,
    ),
  })),
);
