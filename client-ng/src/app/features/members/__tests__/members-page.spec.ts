import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { MembersPage } from '../members-page';
import { UsersFacade } from '../store/users.facade';
import { initialUsersState } from '../store/users.state';
import { initialAuthState } from '../../../store/auth/auth.state';
import type { User } from '../../../shared/models/user.model';
import type { UpdateUserData, NewUserData } from '../store/users.actions';

const initialState = { users: initialUsersState, auth: initialAuthState };

const makeUser = (overrides: Partial<User> = {}): User => ({
  _id: 'u1',
  username: 'Alice',
  email: 'a@a.com',
  department: 'Management',
  roles: [],
  ...overrides,
});

describe('MembersPage', () => {
  let component: MembersPage;
  let facade: UsersFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(MembersPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [MembersPage],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    facade = TestBed.inject(UsersFacade);

    const fixture = TestBed.createComponent(MembersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // byDepartment()
  describe('byDepartment()', () => {
    it('returns users whose department matches', () => {
      const users = [
        makeUser({ _id: 'u1', department: 'Management' }),
        makeUser({ _id: 'u2', department: 'Technique' }),
        makeUser({ _id: 'u3', department: 'Management' }),
      ];
      const result = component.byDepartment(users, 'Management');
      expect(result).toHaveLength(2);
      expect(result.map((u) => u._id)).toEqual(['u1', 'u3']);
    });

    it('returns empty array when none match', () => {
      const users = [
        makeUser({ _id: 'u1', department: 'Technique' }),
        makeUser({ _id: 'u2', department: 'Technique' }),
      ];
      const result = component.byDepartment(users, 'Management');
      expect(result).toEqual([]);
    });
  });

  // canEdit() with initial auth state (not admin, not superadmin)
  describe('canEdit()', () => {
    it('returns false when user is not admin nor superadmin', () => {
      const user = makeUser();
      expect(component.canEdit(user)).toBe(false);
    });
  });

  // showRoles() with initial auth state
  describe('showRoles()', () => {
    it('returns false when user is not admin nor superadmin', () => {
      expect(component.showRoles()).toBe(false);
    });
  });

  // openEditModal()
  describe('openEditModal()', () => {
    it('sets editingUser signal to the given user', () => {
      const user = makeUser();
      component.openEditModal(user);
      expect(component.editingUser()).toEqual(user);
    });
  });

  // onSave()
  describe('onSave()', () => {
    it('calls facade.updateUser with user._id and data when editingUser is set', () => {
      const spy = vi.spyOn(facade, 'updateUser');
      const user = makeUser({ _id: 'u42' });
      component.editingUser.set(user);
      const data: UpdateUserData = { username: 'Bob' };

      component.onSave(data);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith('u42', data);
    });

    it('clears editingUser to null after saving', () => {
      vi.spyOn(facade, 'updateUser');
      const user = makeUser();
      component.editingUser.set(user);

      component.onSave({ username: 'Bob' });

      expect(component.editingUser()).toBeNull();
    });

    it('does NOT call facade.updateUser when editingUser is null', () => {
      const spy = vi.spyOn(facade, 'updateUser');
      component.editingUser.set(null);

      component.onSave({ username: 'Bob' });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // onAdd()
  describe('onAdd()', () => {
    it('calls facade.addUser with the given data', () => {
      const spy = vi.spyOn(facade, 'addUser');
      const data: NewUserData = { username: 'Charlie', email: 'c@c.com', password: 'pass123' };

      component.onAdd(data);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(data);
    });

    it('sets showAddModal to false', () => {
      vi.spyOn(facade, 'addUser');
      component.showAddModal.set(true);

      component.onAdd({ username: 'Charlie', email: 'c@c.com', password: 'pass123' });

      expect(component.showAddModal()).toBe(false);
    });
  });

  // onPictureUpload()
  describe('onPictureUpload()', () => {
    it('calls facade.uploadPicture with the given id and formData', () => {
      const spy = vi.spyOn(facade, 'uploadPicture');
      const formData = new FormData();

      component.onPictureUpload({ id: 'u1', formData });

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith('u1', formData);
    });
  });

  // onDeleteConfirm()
  describe('onDeleteConfirm()', () => {
    it('calls facade.deleteUser with user._id when deletingUser is set', () => {
      const spy = vi.spyOn(facade, 'deleteUser');
      const user = makeUser({ _id: 'u99' });
      component.deletingUser.set(user);

      component.onDeleteConfirm();

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith('u99');
    });

    it('clears deletingUser to null after confirming delete', () => {
      vi.spyOn(facade, 'deleteUser');
      const user = makeUser();
      component.deletingUser.set(user);

      component.onDeleteConfirm();

      expect(component.deletingUser()).toBeNull();
    });

    it('does NOT call facade.deleteUser when deletingUser is null', () => {
      const spy = vi.spyOn(facade, 'deleteUser');
      component.deletingUser.set(null);

      component.onDeleteConfirm();

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
