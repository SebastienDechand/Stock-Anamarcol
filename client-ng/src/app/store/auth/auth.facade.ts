import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { User } from '../../shared/models/user.model';
import { AuthActions } from './auth.actions';
import {
  selectAuthLoading,
  selectAuthStatus,
  selectCurrentUser,
  selectIsAdmin,
  selectIsAuthenticated,
  selectIsHotline,
  selectIsMonteur,
  selectIsSuperadmin,
  selectLoginError,
  selectRoles,
  selectUid,
} from './auth.selectors';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private store = inject(Store);

  uid$ = this.store.select(selectUid);
  roles$ = this.store.select(selectRoles);
  user$ = this.store.select(selectCurrentUser);
  status$ = this.store.select(selectAuthStatus);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  isAdmin$ = this.store.select(selectIsAdmin);
  isSuperadmin$ = this.store.select(selectIsSuperadmin);
  isHotline$ = this.store.select(selectIsHotline);
  isMonteur$ = this.store.select(selectIsMonteur);
  loginError$ = this.store.select(selectLoginError);
  isLoading$ = this.store.select(selectAuthLoading);

  checkSession() {
    this.store.dispatch(AuthActions.checkSession());
  }

  login(email: string, password: string) {
    this.store.dispatch(AuthActions.login({ email, password }));
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }

  updateProfile(uid: string, data: Partial<User>) {
    this.store.dispatch(AuthActions.updateUserProfile({ uid, data }));
  }
}
