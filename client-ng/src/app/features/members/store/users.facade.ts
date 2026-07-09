import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { Role } from '../../../shared/constants/roles.constants';
import { UsersActions, NewUserData, UpdateUserData } from './users.actions';
import {
  selectAllUsers,
  selectSavingRoleIds,
  selectUsersLoaded,
  selectUsersLoading,
} from './users.selectors';

@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private store = inject(Store);

  users$ = this.store.select(selectAllUsers);
  isLoading$ = combineLatest([
    this.store.select(selectUsersLoading),
    this.store.select(selectUsersLoaded),
  ]).pipe(map(([loading, loaded]) => loading && !loaded));
  savingRoleIds$ = this.store.select(selectSavingRoleIds);

  loadAll() {
    this.store.dispatch(UsersActions.loadAllUsers());
  }
  addUser(data: NewUserData) {
    this.store.dispatch(UsersActions.addUser({ data }));
  }
  deleteUser(id: string) {
    this.store.dispatch(UsersActions.deleteUser({ id }));
  }
  updateUser(id: string, data: UpdateUserData) {
    this.store.dispatch(UsersActions.updateUser({ id, data }));
  }
  updateRoles(id: string, roles: Role[]) {
    this.store.dispatch(UsersActions.updateRoles({ id, roles }));
  }
  uploadPicture(id: string, formData: FormData) {
    this.store.dispatch(UsersActions.uploadPicture({ id, formData }));
  }
}
