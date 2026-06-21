import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AdminRolesPage } from '../admin-roles-page';
import { UsersFacade } from '../../membres/store/users.facade';
import { initialUsersState } from '../../membres/store/users.state';
import { selectSavingRoleIds } from '../../membres/store/users.selectors';
import { initialAuthState } from '../../../store/auth/auth.state';
import { Role } from '../../../shared/constants/roles.constants';
import type { User } from '../../../shared/models/user.model';

const initialState = { users: initialUsersState, auth: initialAuthState };

const makeUser = (overrides: Partial<User> = {}): User => ({
  _id: 'u1',
  pseudo: 'Alice',
  email: 'alice@example.com',
  roles: [Role.USER],
  ...overrides,
});

describe('AdminRolesPage', () => {
  let component: AdminRolesPage;
  let facade: UsersFacade;
  let store: MockStore;

  beforeEach(async () => {
    TestBed.overrideComponent(AdminRolesPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [AdminRolesPage],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    facade = TestBed.inject(UsersFacade);
    store = TestBed.inject(MockStore);
    vi.spyOn(facade, 'loadAll').mockImplementation(() => {});

    const fixture = TestBed.createComponent(AdminRolesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    store.resetSelectors();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit calls facade.loadAll', () => {
    expect(facade.loadAll).toHaveBeenCalled();
  });

  describe('filterUsers()', () => {
    it('returns all users when searchTerm is empty', () => {
      const users = [makeUser(), makeUser({ _id: 'u2', pseudo: 'Bob', email: 'bob@example.com' })];
      component.searchTerm.set('');
      expect(component.filterUsers(users)).toEqual(users);
    });

    it('filters by pseudo when searchTerm matches', () => {
      const alice = makeUser();
      const bob = makeUser({ _id: 'u2', pseudo: 'Bob', email: 'bob@example.com' });
      component.searchTerm.set('ali');
      expect(component.filterUsers([alice, bob])).toEqual([alice]);
    });

    it('filters by email when searchTerm matches', () => {
      const alice = makeUser();
      const bob = makeUser({ _id: 'u2', pseudo: 'Bob', email: 'bob@example.com' });
      component.searchTerm.set('bob@');
      expect(component.filterUsers([alice, bob])).toEqual([bob]);
    });

    it('returns empty array when no match', () => {
      const users = [makeUser(), makeUser({ _id: 'u2', pseudo: 'Bob', email: 'bob@example.com' })];
      component.searchTerm.set('zzz');
      expect(component.filterUsers(users)).toEqual([]);
    });
  });

  describe('userRoles()', () => {
    it('returns [Role.USER] for user with no roles (empty array)', () => {
      const user = makeUser({ roles: [] });
      expect(component.userRoles(user)).toEqual([Role.USER]);
    });

    it('keeps existing roles when user has [Role.ADMIN]', () => {
      const user = makeUser({ roles: [Role.USER, Role.ADMIN] });
      const roles = component.userRoles(user);
      expect(roles).toContain(Role.USER);
      expect(roles).toContain(Role.ADMIN);
    });

    it('prepends Role.USER when user has [Role.ADMIN] but no USER', () => {
      const user = makeUser({ roles: [Role.ADMIN] });
      const roles = component.userRoles(user);
      expect(roles[0]).toBe(Role.USER);
      expect(roles).toContain(Role.ADMIN);
    });

    it('does not duplicate USER role', () => {
      const user = makeUser({ roles: [Role.USER, Role.USER] });
      const roles = component.userRoles(user);
      const userCount = roles.filter((r: Role) => r === Role.USER).length;
      expect(userCount).toBe(1);
    });
  });

  describe('hasRole()', () => {
    it('returns true for USER role (always)', () => {
      const user = makeUser({ roles: [Role.USER] });
      expect(component.hasRole(user, Role.USER)).toBe(true);
    });

    it('returns false for ADMIN when user only has USER role', () => {
      const user = makeUser({ roles: [Role.USER] });
      expect(component.hasRole(user, Role.ADMIN)).toBe(false);
    });
  });

  describe('isSaving()', () => {
    it('returns false when the store has no pending role update for the user', () => {
      expect(component.isSaving('u1')).toBe(false);
    });

    it('returns true when the store reports a pending role update for the user', () => {
      store.overrideSelector(selectSavingRoleIds, ['u1']);
      store.refreshState();
      expect(component.isSaving('u1')).toBe(true);
    });
  });

  describe('toggleRole()', () => {
    it("does nothing for Role.USER (can't toggle)", () => {
      vi.spyOn(facade, 'updateRoles').mockImplementation(() => {});
      const user = makeUser();
      component.toggleRole(user, Role.USER);
      expect(facade.updateRoles).not.toHaveBeenCalled();
    });

    it('does nothing when the user already has a pending role update', () => {
      vi.spyOn(facade, 'updateRoles').mockImplementation(() => {});
      const user = makeUser();
      store.overrideSelector(selectSavingRoleIds, [user._id]);
      store.refreshState();
      component.toggleRole(user, Role.ADMIN);
      expect(facade.updateRoles).not.toHaveBeenCalled();
    });

    it('calls facade.updateRoles when toggling ADMIN role for user without it', () => {
      vi.spyOn(facade, 'updateRoles').mockImplementation(() => {});
      const user = makeUser({ roles: [Role.USER] });
      component.toggleRole(user, Role.ADMIN);
      expect(facade.updateRoles).toHaveBeenCalledWith(
        user._id,
        expect.arrayContaining([Role.USER, Role.ADMIN]),
      );
    });

    it('ensures Role.USER is always in the next roles array', () => {
      vi.spyOn(facade, 'updateRoles').mockImplementation(() => {});
      const user = makeUser({ roles: [Role.USER, Role.ADMIN] });
      component.toggleRole(user, Role.ADMIN);
      expect(facade.updateRoles).toHaveBeenCalledWith(
        user._id,
        expect.arrayContaining([Role.USER]),
      );
    });
  });
});
