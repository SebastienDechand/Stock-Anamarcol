import { describe, it, expect } from 'vitest';
import { selectAllUsers, selectUsersLoading, selectUsersLoaded } from '../users.selectors';
import { initialUsersState } from '../users.state';
import type { User } from '../../../../shared/models/user.model';

const sampleUser: User = {
  _id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  position: 'Technicienne',
};

const sampleUser2: User = {
  _id: 'user-2',
  username: 'bob',
  email: 'bob@example.com',
  position: 'Monteur',
};

describe('Users Selectors', () => {
  describe('selectAllUsers', () => {
    it('should return empty array from initial state', () => {
      const state = { users: initialUsersState };
      expect(selectAllUsers(state)).toEqual([]);
    });

    it('should return users when populated', () => {
      const state = { users: { ...initialUsersState, users: [sampleUser, sampleUser2] } };
      expect(selectAllUsers(state)).toEqual([sampleUser, sampleUser2]);
    });
  });

  describe('selectUsersLoading', () => {
    it('should return false from initial state', () => {
      const state = { users: initialUsersState };
      expect(selectUsersLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = { users: { ...initialUsersState, isLoading: true } };
      expect(selectUsersLoading(state)).toBe(true);
    });
  });

  describe('selectUsersLoaded', () => {
    it('should return false from initial state', () => {
      const state = { users: initialUsersState };
      expect(selectUsersLoaded(state)).toBe(false);
    });

    it('should return true when loaded', () => {
      const state = { users: { ...initialUsersState, loaded: true } };
      expect(selectUsersLoaded(state)).toBe(true);
    });
  });
});
