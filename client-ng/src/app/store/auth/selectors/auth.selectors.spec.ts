import { describe, it, expect } from 'vitest';
import {
  selectUid,
  selectRoles,
  selectCurrentUser,
  selectAuthStatus,
  selectIsAuthenticated,
  selectIsAdmin,
  selectIsSuperadmin,
  selectIsHotline,
  selectIsMonteur,
  selectLoginError,
  selectAuthLoading,
} from './auth.selectors';
import { initialAuthState } from '../state/auth.state';
import { Role } from '../../../shared/constants/roles/roles.constants';
import type { User } from '../../../shared/models/user/user.model';

const sampleUser: User = {
  _id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  roles: [Role.ADMIN],
};

describe('Auth Selectors', () => {
  describe('selectUid', () => {
    it('should return null from initial state', () => {
      const state = { auth: initialAuthState };
      expect(selectUid(state)).toBeNull();
    });

    it('should return uid when set', () => {
      const state = { auth: { ...initialAuthState, uid: 'firebase-uid-123' } };
      expect(selectUid(state)).toBe('firebase-uid-123');
    });
  });

  describe('selectRoles', () => {
    it('should return empty array from initial state', () => {
      const state = { auth: initialAuthState };
      expect(selectRoles(state)).toEqual([]);
    });

    it('should return roles when set', () => {
      const state = { auth: { ...initialAuthState, roles: [Role.ADMIN, Role.USER] } };
      expect(selectRoles(state)).toEqual([Role.ADMIN, Role.USER]);
    });
  });

  describe('selectCurrentUser', () => {
    it('should return null from initial state', () => {
      const state = { auth: initialAuthState };
      expect(selectCurrentUser(state)).toBeNull();
    });

    it('should return the current user when set', () => {
      const state = { auth: { ...initialAuthState, user: sampleUser } };
      expect(selectCurrentUser(state)).toEqual(sampleUser);
    });
  });

  describe('selectAuthStatus', () => {
    it('should return "idle" from initial state', () => {
      const state = { auth: initialAuthState };
      expect(selectAuthStatus(state)).toBe('idle');
    });

    it('should return "loading" when loading', () => {
      const state = { auth: { ...initialAuthState, status: 'loading' as const } };
      expect(selectAuthStatus(state)).toBe('loading');
    });

    it('should return "authenticated" when authenticated', () => {
      const state = { auth: { ...initialAuthState, status: 'authenticated' as const } };
      expect(selectAuthStatus(state)).toBe('authenticated');
    });

    it('should return "unauthenticated" when unauthenticated', () => {
      const state = { auth: { ...initialAuthState, status: 'unauthenticated' as const } };
      expect(selectAuthStatus(state)).toBe('unauthenticated');
    });
  });

  describe('selectIsAuthenticated', () => {
    it('should return false from initial state (idle)', () => {
      const state = { auth: initialAuthState };
      expect(selectIsAuthenticated(state)).toBe(false);
    });

    it('should return true when status is authenticated', () => {
      const state = { auth: { ...initialAuthState, status: 'authenticated' as const } };
      expect(selectIsAuthenticated(state)).toBe(true);
    });

    it('should return false when status is loading', () => {
      const state = { auth: { ...initialAuthState, status: 'loading' as const } };
      expect(selectIsAuthenticated(state)).toBe(false);
    });

    it('should return false when status is unauthenticated', () => {
      const state = { auth: { ...initialAuthState, status: 'unauthenticated' as const } };
      expect(selectIsAuthenticated(state)).toBe(false);
    });
  });

  describe('selectIsAdmin', () => {
    it('should return false from initial state', () => {
      const state = { auth: initialAuthState };
      expect(selectIsAdmin(state)).toBe(false);
    });

    it('should return true when isAdmin is true', () => {
      const state = { auth: { ...initialAuthState, isAdmin: true } };
      expect(selectIsAdmin(state)).toBe(true);
    });
  });

  describe('selectIsSuperadmin', () => {
    it('should return false from initial state', () => {
      const state = { auth: initialAuthState };
      expect(selectIsSuperadmin(state)).toBe(false);
    });

    it('should return true when isSuperadmin is true', () => {
      const state = { auth: { ...initialAuthState, isSuperadmin: true } };
      expect(selectIsSuperadmin(state)).toBe(true);
    });
  });

  describe('selectIsHotline', () => {
    it('should return false from initial state', () => {
      const state = { auth: initialAuthState };
      expect(selectIsHotline(state)).toBe(false);
    });

    it('should return true when isHotline is true', () => {
      const state = { auth: { ...initialAuthState, isHotline: true } };
      expect(selectIsHotline(state)).toBe(true);
    });
  });

  describe('selectIsMonteur', () => {
    it('should return false from initial state', () => {
      const state = { auth: initialAuthState };
      expect(selectIsMonteur(state)).toBe(false);
    });

    it('should return true when isMonteur is true', () => {
      const state = { auth: { ...initialAuthState, isMonteur: true } };
      expect(selectIsMonteur(state)).toBe(true);
    });
  });

  describe('selectLoginError', () => {
    it('should return null from initial state', () => {
      const state = { auth: initialAuthState };
      expect(selectLoginError(state)).toBeNull();
    });

    it('should return the error message when set', () => {
      const state = { auth: { ...initialAuthState, loginError: 'Invalid credentials' } };
      expect(selectLoginError(state)).toBe('Invalid credentials');
    });
  });

  describe('selectAuthLoading', () => {
    it('should return false from initial state (idle)', () => {
      const state = { auth: initialAuthState };
      expect(selectAuthLoading(state)).toBe(false);
    });

    it('should return true when status is loading', () => {
      const state = { auth: { ...initialAuthState, status: 'loading' as const } };
      expect(selectAuthLoading(state)).toBe(true);
    });

    it('should return false when status is authenticated', () => {
      const state = { auth: { ...initialAuthState, status: 'authenticated' as const } };
      expect(selectAuthLoading(state)).toBe(false);
    });
  });
});
