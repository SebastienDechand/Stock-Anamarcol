import { describe, it, expect } from 'vitest';
import { usersReducer } from './users.reducer';
import { UsersActions } from '../actions/users.actions';
import { initialUsersState } from '../state/users.state';
import type { User } from '../../../../shared/models/user/user.model';
import { Role } from '../../../../shared/constants/roles/roles.constants';

const sampleUser: User = {
  _id: 'u1',
  username: 'jdupont',
  email: 'jdupont@example.com',
  position: 'Technicien',
  roles: [Role.USER],
};

const otherUser: User = {
  _id: 'u2',
  username: 'cmartin',
  email: 'cmartin@example.com',
  position: 'Admin',
  roles: [Role.ADMIN],
};

describe('usersReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = usersReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialUsersState);
  });

  it('should handle loadAllUsers by setting isLoading to true', () => {
    const state = usersReducer(initialUsersState, UsersActions.loadAllUsers());
    expect(state.isLoading).toBe(true);
  });

  it('should handle loadAllUsersSuccess', () => {
    const state = usersReducer(
      { ...initialUsersState, isLoading: true },
      UsersActions.loadAllUsersSuccess({ users: [sampleUser, otherUser] }),
    );
    expect(state.users).toEqual([sampleUser, otherUser]);
    expect(state.loaded).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle loadAllUsersFailure', () => {
    const state = usersReducer(
      { ...initialUsersState, isLoading: true },
      UsersActions.loadAllUsersFailure({ error: 'Accès refusé' }),
    );
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Accès refusé');
  });

  it('should handle deleteUserSuccess by removing the user from the list', () => {
    const state = usersReducer(
      { ...initialUsersState, users: [sampleUser, otherUser] },
      UsersActions.deleteUserSuccess({ id: 'u1' }),
    );
    expect(state.users).toEqual([otherUser]);
  });

  it('should not remove other users on deleteUserSuccess', () => {
    const state = usersReducer(
      { ...initialUsersState, users: [sampleUser, otherUser] },
      UsersActions.deleteUserSuccess({ id: 'u1' }),
    );
    expect(state.users).toHaveLength(1);
    expect(state.users[0]._id).toBe('u2');
  });

  it('should handle updateUserSuccess by merging data into the matching user', () => {
    const state = usersReducer(
      { ...initialUsersState, users: [sampleUser, otherUser] },
      UsersActions.updateUserSuccess({
        id: 'u1',
        data: { username: 'jdupont2', position: 'Senior' },
      }),
    );
    const updated = state.users.find((u) => u._id === 'u1');
    expect(updated?.username).toBe('jdupont2');
    expect(updated?.position).toBe('Senior');
    expect(updated?.email).toBe('jdupont@example.com');
  });

  it('should handle updateUserSuccess without touching other users', () => {
    const state = usersReducer(
      { ...initialUsersState, users: [sampleUser, otherUser] },
      UsersActions.updateUserSuccess({ id: 'u1', data: { username: 'jdupont2' } }),
    );
    expect(state.users.find((u) => u._id === 'u2')).toEqual(otherUser);
  });

  it('should handle updateRoles optimistically by updating roles on the matching user', () => {
    const newRoles: Role[] = [Role.ADMIN, Role.USER];
    const state = usersReducer(
      { ...initialUsersState, users: [sampleUser, otherUser] },
      UsersActions.updateRoles({ id: 'u1', roles: newRoles }),
    );
    expect(state.users.find((u) => u._id === 'u1')?.roles).toEqual(newRoles);
  });

  it('should handle updateRoles without touching other users', () => {
    const state = usersReducer(
      { ...initialUsersState, users: [sampleUser, otherUser] },
      UsersActions.updateRoles({ id: 'u1', roles: [Role.HOTLINE] }),
    );
    expect(state.users.find((u) => u._id === 'u2')?.roles).toEqual([Role.ADMIN]);
  });

  it('should handle updateRolesFailure by rolling back to previousRoles', () => {
    const previousRoles: Role[] = [Role.USER];
    const stateWithUpdatedRoles = {
      ...initialUsersState,
      users: [{ ...sampleUser, roles: [Role.ADMIN] }, otherUser],
    };
    const state = usersReducer(
      stateWithUpdatedRoles,
      UsersActions.updateRolesFailure({ id: 'u1', previousRoles, error: 'Échec mise à jour' }),
    );
    expect(state.users.find((u) => u._id === 'u1')?.roles).toEqual(previousRoles);
  });

  it('should handle updateRolesFailure without touching other users', () => {
    const state = usersReducer(
      { ...initialUsersState, users: [sampleUser, otherUser] },
      UsersActions.updateRolesFailure({
        id: 'u1',
        previousRoles: [Role.USER],
        error: 'Échec',
      }),
    );
    expect(state.users.find((u) => u._id === 'u2')?.roles).toEqual([Role.ADMIN]);
  });

  it('should handle uploadPictureSuccess by merging the updated user into the list', () => {
    const updatedUser: User = { ...sampleUser, picture: 'uploads/newpic.jpg' };
    const state = usersReducer(
      { ...initialUsersState, users: [sampleUser, otherUser] },
      UsersActions.uploadPictureSuccess({ user: updatedUser }),
    );
    expect(state.users.find((u) => u._id === 'u1')?.picture).toBe('uploads/newpic.jpg');
  });

  it('should handle uploadPictureSuccess without touching other users', () => {
    const updatedUser: User = { ...sampleUser, picture: 'uploads/newpic.jpg' };
    const state = usersReducer(
      { ...initialUsersState, users: [sampleUser, otherUser] },
      UsersActions.uploadPictureSuccess({ user: updatedUser }),
    );
    expect(state.users.find((u) => u._id === 'u2')).toEqual(otherUser);
  });
});
