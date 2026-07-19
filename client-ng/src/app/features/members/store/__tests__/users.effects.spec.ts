import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of, throwError, Subject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';
import { UsersEffects } from '../users.effects';
import { UsersActions } from '../users.actions';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { selectAllUsers } from '../users.selectors';
import type { User } from '../../../../shared/models/user.model';
import { Role } from '../../../../shared/constants/roles.constants';
import type { NewUserData, UpdateUserData } from '../users.actions';

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

const newUserData: NewUserData = {
  username: 'newuser',
  email: 'newuser@example.com',
  password: 'password123',
  position: 'Monteur',
};

const updateUserData: UpdateUserData = {
  username: 'jdupont-updated',
  position: 'Senior Technicien',
};

describe('UsersEffects', () => {
  let effects: UsersEffects;
  let actions$: Subject<Action>;
  let api: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    postFormData: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let store: MockStore;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    api = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      postFormData: vi.fn(),
    };
    toast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UsersEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            users: { users: [sampleUser, otherUser], isLoading: false, loaded: true, error: null },
          },
        }),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    effects = TestBed.inject(UsersEffects);
    store = TestBed.inject(MockStore);
  });

  afterEach(() => {
    store.resetSelectors();
  });

  // ─── loadAll$ ───────────────────────────────────────────────────────────────

  describe('loadAll$', () => {
    it('should dispatch loadAllUsersSuccess on success', async () => {
      api.get.mockReturnValue(of([sampleUser, otherUser]));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(UsersActions.loadAllUsers());
      const result = await loadAllPromise;

      expect(result).toEqual(UsersActions.loadAllUsersSuccess({ users: [sampleUser, otherUser] }));
    });

    it('should dispatch loadAllUsersFailure on error', async () => {
      api.get.mockReturnValue(throwError(() => ({ message: 'Network error' })));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(UsersActions.loadAllUsers());
      const result = await loadAllPromise;

      expect(result).toEqual(UsersActions.loadAllUsersFailure({ error: 'Network error' }));
    });

    it('should use fallback error message when err.message is absent', async () => {
      api.get.mockReturnValue(throwError(() => ({})));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(UsersActions.loadAllUsers());
      const result = await loadAllPromise;

      expect(result).toEqual(UsersActions.loadAllUsersFailure({ error: 'Erreur' }));
    });
  });

  // ─── addUser$ ────────────────────────────────────────────────────────────────

  describe('addUser$', () => {
    it('should dispatch addUserSuccess and call toast.success on success', async () => {
      api.post.mockReturnValue(of(undefined));

      const addUserPromise = firstValueFrom(effects.addUser$);
      actions$.next(UsersActions.addUser({ data: newUserData }));
      const result = await addUserPromise;

      expect(result).toEqual(UsersActions.addUserSuccess());
      expect(toast.success).toHaveBeenCalledWith('TOAST.MEMBER_ADDED');
    });

    it('should dispatch addUserFailure and call toast.error on error', async () => {
      api.post.mockReturnValue(
        throwError(() => ({ message: 'Server error', error: { message: 'Email déjà utilisé' } })),
      );

      const addUserPromise = firstValueFrom(effects.addUser$);
      actions$.next(UsersActions.addUser({ data: newUserData }));
      const result = await addUserPromise;

      expect(result).toEqual(UsersActions.addUserFailure({ error: 'Server error' }));
      expect(toast.error).toHaveBeenCalledWith('Email déjà utilisé');
    });

    it('should use TOAST.MEMBER_ADD_ERROR when err.error.message is absent', async () => {
      api.post.mockReturnValue(throwError(() => ({ message: 'Server error' })));

      const addUserPromise = firstValueFrom(effects.addUser$);
      actions$.next(UsersActions.addUser({ data: newUserData }));
      await addUserPromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.MEMBER_ADD_ERROR');
    });
  });

  // ─── reloadAfterAdd$ ─────────────────────────────────────────────────────────

  describe('reloadAfterAdd$', () => {
    it('should dispatch loadAllUsers after addUserSuccess', async () => {
      const reloadAfterAddPromise = firstValueFrom(effects.reloadAfterAdd$);
      actions$.next(UsersActions.addUserSuccess());
      const result = await reloadAfterAddPromise;

      expect(result).toEqual(UsersActions.loadAllUsers());
    });
  });

  // ─── deleteUser$ ─────────────────────────────────────────────────────────────

  describe('deleteUser$', () => {
    it('should dispatch deleteUserSuccess and call toast.success on success', async () => {
      api.delete.mockReturnValue(of(undefined));

      const deleteUserPromise = firstValueFrom(effects.deleteUser$);
      actions$.next(UsersActions.deleteUser({ id: 'u1' }));
      const result = await deleteUserPromise;

      expect(result).toEqual(UsersActions.deleteUserSuccess({ id: 'u1' }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.MEMBER_DELETED');
    });

    it('should dispatch deleteUserFailure and call toast.error on error', async () => {
      api.delete.mockReturnValue(throwError(() => ({ message: 'Not found' })));

      const deleteUserPromise = firstValueFrom(effects.deleteUser$);
      actions$.next(UsersActions.deleteUser({ id: 'u1' }));
      const result = await deleteUserPromise;

      expect(result).toEqual(UsersActions.deleteUserFailure({ error: 'Not found' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.MEMBER_DELETE_ERROR');
    });

    it('should use fallback error message when err.message is absent', async () => {
      api.delete.mockReturnValue(throwError(() => ({})));

      const deleteUserPromise = firstValueFrom(effects.deleteUser$);
      actions$.next(UsersActions.deleteUser({ id: 'u1' }));
      const result = await deleteUserPromise;

      expect(result).toEqual(UsersActions.deleteUserFailure({ error: 'Erreur' }));
    });
  });

  // ─── updateUser$ ─────────────────────────────────────────────────────────────

  describe('updateUser$', () => {
    it('should dispatch updateUserSuccess and call toast.success on success', async () => {
      api.put.mockReturnValue(of(undefined));

      const updateUserPromise = firstValueFrom(effects.updateUser$);
      actions$.next(UsersActions.updateUser({ id: 'u1', data: updateUserData }));
      const result = await updateUserPromise;

      expect(result).toEqual(UsersActions.updateUserSuccess({ id: 'u1', data: updateUserData }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.MEMBER_UPDATED');
    });

    it('should dispatch updateUserFailure and call toast.error on error', async () => {
      api.put.mockReturnValue(throwError(() => ({ message: 'Conflict' })));

      const updateUserPromise = firstValueFrom(effects.updateUser$);
      actions$.next(UsersActions.updateUser({ id: 'u1', data: updateUserData }));
      const result = await updateUserPromise;

      expect(result).toEqual(UsersActions.updateUserFailure({ error: 'Conflict' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.MEMBER_UPDATE_ERROR');
    });

    it('should use fallback error message when err.message is absent', async () => {
      api.put.mockReturnValue(throwError(() => ({})));

      const updateUserPromise = firstValueFrom(effects.updateUser$);
      actions$.next(UsersActions.updateUser({ id: 'u1', data: updateUserData }));
      const result = await updateUserPromise;

      expect(result).toEqual(UsersActions.updateUserFailure({ error: 'Erreur' }));
    });
  });

  // ─── updateRoles$ ────────────────────────────────────────────────────────────

  describe('updateRoles$', () => {
    const newRoles: Role[] = [Role.ADMIN, Role.HOTLINE];

    it('should dispatch updateRolesSuccess and call toast.success on success', async () => {
      store.overrideSelector(selectAllUsers, [sampleUser, otherUser]);
      store.refreshState();
      api.put.mockReturnValue(of(undefined));

      const updateRolesPromise = firstValueFrom(effects.updateRoles$);
      actions$.next(UsersActions.updateRoles({ id: 'u1', roles: newRoles }));
      const result = await updateRolesPromise;

      expect(result).toEqual(UsersActions.updateRolesSuccess({ id: 'u1', roles: newRoles }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.MEMBER_ROLES_UPDATED');
    });

    it('should dispatch updateRolesFailure with previousRoles and call toast.error on error', async () => {
      store.overrideSelector(selectAllUsers, [sampleUser, otherUser]);
      store.refreshState();
      api.put.mockReturnValue(throwError(() => ({ message: 'Unauthorized' })));

      const updateRolesPromise = firstValueFrom(effects.updateRoles$);
      actions$.next(UsersActions.updateRoles({ id: 'u1', roles: newRoles }));
      const result = await updateRolesPromise;

      expect(result).toEqual(
        UsersActions.updateRolesFailure({
          id: 'u1',
          previousRoles: [Role.USER],
          error: 'Unauthorized',
        }),
      );
      expect(toast.error).toHaveBeenCalledWith('TOAST.MEMBER_ROLES_UPDATE_ERROR');
    });

    it('should use empty array as previousRoles when user is not found in store', async () => {
      store.overrideSelector(selectAllUsers, []);
      store.refreshState();
      api.put.mockReturnValue(throwError(() => ({ message: 'Unauthorized' })));

      const updateRolesPromise = firstValueFrom(effects.updateRoles$);
      actions$.next(UsersActions.updateRoles({ id: 'u1', roles: newRoles }));
      const result = await updateRolesPromise;

      expect(result).toEqual(
        UsersActions.updateRolesFailure({
          id: 'u1',
          previousRoles: [],
          error: 'Unauthorized',
        }),
      );
    });

    it('should use fallback error message when err.message is absent', async () => {
      store.overrideSelector(selectAllUsers, [sampleUser]);
      store.refreshState();
      api.put.mockReturnValue(throwError(() => ({})));

      const updateRolesPromise = firstValueFrom(effects.updateRoles$);
      actions$.next(UsersActions.updateRoles({ id: 'u1', roles: newRoles }));
      const result = await updateRolesPromise;

      expect(result).toEqual(
        UsersActions.updateRolesFailure({
          id: 'u1',
          previousRoles: [Role.USER],
          error: 'Erreur',
        }),
      );
    });
  });

  // ─── uploadPicture$ ──────────────────────────────────────────────────────────

  describe('uploadPicture$', () => {
    it('should dispatch uploadPictureSuccess and call toast.success on success', async () => {
      const updatedUser: User = { ...sampleUser, picture: 'uploads/newpic.jpg' };
      api.postFormData.mockReturnValue(of(updatedUser));
      const formData = new FormData();

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(UsersActions.uploadPicture({ id: 'u1', formData }));
      const result = await uploadPicturePromise;

      expect(api.postFormData).toHaveBeenCalledWith('api/user/upload', formData);
      expect(result).toEqual(UsersActions.uploadPictureSuccess({ user: updatedUser }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.PROFIL_PHOTO_UPDATED');
    });

    it('should dispatch uploadPictureFailure and call toast.error on error', async () => {
      api.postFormData.mockReturnValue(throwError(() => ({ message: 'Upload failed' })));
      const formData = new FormData();

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(UsersActions.uploadPicture({ id: 'u1', formData }));
      const result = await uploadPicturePromise;

      expect(result).toEqual(UsersActions.uploadPictureFailure({ error: 'Upload failed' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.PROFIL_PHOTO_ERROR');
    });

    it('should use fallback error message when err.message is absent', async () => {
      api.postFormData.mockReturnValue(throwError(() => ({})));
      const formData = new FormData();

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(UsersActions.uploadPicture({ id: 'u1', formData }));
      const result = await uploadPicturePromise;

      expect(result).toEqual(UsersActions.uploadPictureFailure({ error: 'Erreur' }));
    });
  });
});
