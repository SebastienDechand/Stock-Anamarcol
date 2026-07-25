import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UsersState } from '../state/users.state';

export const selectUsersState = createFeatureSelector<UsersState>('users');

export const selectAllUsers = createSelector(selectUsersState, (state) => state.users);
export const selectUsersLoading = createSelector(selectUsersState, (state) => state.isLoading);
export const selectUsersLoaded = createSelector(selectUsersState, (state) => state.loaded);
export const selectSavingRoleIds = createSelector(selectUsersState, (state) => state.savingRoleIds);
