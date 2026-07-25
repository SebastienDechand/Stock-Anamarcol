import { createReducer, on } from '@ngrx/store';
import { Role } from '../../../shared/constants/roles/roles.constants';
import { AuthActions } from '../actions/auth.actions';
import { initialAuthState } from '../state/auth.state';

function deriveRoleFlags(roles: Role[]) {
  return {
    isAdmin: roles.includes(Role.ADMIN) || roles.includes(Role.SUPERADMIN),
    isSuperadmin: roles.includes(Role.SUPERADMIN),
    isHotline:
      roles.includes(Role.HOTLINE) || roles.includes(Role.ADMIN) || roles.includes(Role.SUPERADMIN),
    isMonteur:
      roles.includes(Role.MONTEUR) || roles.includes(Role.ADMIN) || roles.includes(Role.SUPERADMIN),
  };
}

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.checkSession, (state) => ({
    ...state,
    status: 'loading' as const,
  })),

  on(AuthActions.checkSessionSuccess, (state, { uid, roles }) => ({
    ...state,
    uid,
    roles,
    ...deriveRoleFlags(roles),
    status: 'authenticated' as const,
    loginError: null,
  })),

  on(AuthActions.checkSessionFailure, (state) => ({
    ...state,
    uid: null,
    roles: [],
    user: null,
    isAdmin: false,
    isSuperadmin: false,
    isHotline: false,
    isMonteur: false,
    status: 'unauthenticated' as const,
  })),

  on(AuthActions.login, (state) => ({
    ...state,
    status: 'loading' as const,
    loginError: null,
  })),

  on(AuthActions.loginSuccess, (state) => ({
    ...state,
    loginError: null,
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    status: 'unauthenticated' as const,
    loginError: error,
  })),

  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
    status: 'unauthenticated' as const,
  })),

  on(AuthActions.loadUserProfileSuccess, (state, { user }) => ({
    ...state,
    user,
  })),

  on(AuthActions.updateUserProfileSuccess, (state, { user }) => ({
    ...state,
    user,
  })),
);
