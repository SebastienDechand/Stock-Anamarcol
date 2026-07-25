import { describe, it, expect } from 'vitest';
import { authReducer } from './auth.reducer';
import { AuthActions } from '../actions/auth.actions';
import { initialAuthState } from '../state/auth.state';
import { Role } from '../../../shared/constants/roles/roles.constants';

describe('authReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialAuthState);
  });

  it('should handle checkSession', () => {
    const state = authReducer(initialAuthState, AuthActions.checkSession());
    expect(state.status).toBe('loading');
  });

  it('should derive role flags from a regular user', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.checkSessionSuccess({ uid: 'u1', roles: [Role.USER] }),
    );
    expect(state.isAdmin).toBe(false);
    expect(state.isSuperadmin).toBe(false);
    expect(state.isHotline).toBe(false);
    expect(state.isMonteur).toBe(false);
    expect(state.status).toBe('authenticated');
  });

  it('should derive role flags from an admin (admin also grants hotline and monteur)', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.checkSessionSuccess({ uid: 'u1', roles: [Role.ADMIN] }),
    );
    expect(state.isAdmin).toBe(true);
    expect(state.isSuperadmin).toBe(false);
    expect(state.isHotline).toBe(true);
    expect(state.isMonteur).toBe(true);
  });

  it('should derive role flags from a superadmin (grants every flag)', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.checkSessionSuccess({ uid: 'u1', roles: [Role.SUPERADMIN] }),
    );
    expect(state.isAdmin).toBe(true);
    expect(state.isSuperadmin).toBe(true);
    expect(state.isHotline).toBe(true);
    expect(state.isMonteur).toBe(true);
  });

  it('should derive isHotline from the hotline role alone', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.checkSessionSuccess({ uid: 'u1', roles: [Role.HOTLINE] }),
    );
    expect(state.isHotline).toBe(true);
    expect(state.isAdmin).toBe(false);
    expect(state.isMonteur).toBe(false);
  });

  it('should reset roles and flags on checkSessionFailure', () => {
    const authenticated = authReducer(
      initialAuthState,
      AuthActions.checkSessionSuccess({ uid: 'u1', roles: [Role.ADMIN] }),
    );
    const state = authReducer(authenticated, AuthActions.checkSessionFailure());
    expect(state.uid).toBeNull();
    expect(state.roles).toEqual([]);
    expect(state.isAdmin).toBe(false);
    expect(state.status).toBe('unauthenticated');
  });

  it('should handle login by clearing previous errors', () => {
    const state = authReducer(
      { ...initialAuthState, loginError: 'previous error' },
      AuthActions.login({ email: 'a@b.com', password: 'secret' }),
    );
    expect(state.status).toBe('loading');
    expect(state.loginError).toBeNull();
  });

  it('should handle loginFailure', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.loginFailure({ error: 'Invalid credentials' }),
    );
    expect(state.status).toBe('unauthenticated');
    expect(state.loginError).toBe('Invalid credentials');
  });

  it('should reset to initial state on logoutSuccess', () => {
    const authenticated = authReducer(
      initialAuthState,
      AuthActions.checkSessionSuccess({ uid: 'u1', roles: [Role.ADMIN] }),
    );
    const state = authReducer(authenticated, AuthActions.logoutSuccess());
    expect(state).toEqual({ ...initialAuthState, status: 'unauthenticated' });
  });

  it('should handle loadUserProfileSuccess', () => {
    const user = { _id: 'u1', username: 'admin', email: 'a@b.com' };
    const state = authReducer(initialAuthState, AuthActions.loadUserProfileSuccess({ user }));
    expect(state.user).toEqual(user);
  });
});
