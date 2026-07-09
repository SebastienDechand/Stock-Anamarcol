import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUid = createSelector(selectAuthState, (state) => state.uid);
export const selectRoles = createSelector(selectAuthState, (state) => state.roles);
export const selectCurrentUser = createSelector(selectAuthState, (state) => state.user);
export const selectAuthStatus = createSelector(selectAuthState, (state) => state.status);
export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.status === 'authenticated',
);
export const selectIsAdmin = createSelector(selectAuthState, (state) => state.isAdmin);
export const selectIsSuperadmin = createSelector(selectAuthState, (state) => state.isSuperadmin);
export const selectIsHotline = createSelector(selectAuthState, (state) => state.isHotline);
export const selectIsMonteur = createSelector(selectAuthState, (state) => state.isMonteur);
export const selectLoginError = createSelector(selectAuthState, (state) => state.loginError);
export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.status === 'loading',
);
