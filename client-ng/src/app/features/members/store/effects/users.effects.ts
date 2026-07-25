import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { Store } from '@ngrx/store';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { User } from '../../../../shared/models/user/user.model';
import { UsersActions } from '../actions/users.actions';
import { selectAllUsers } from '../selectors/users.selectors';
import { take } from 'rxjs';

@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private store = inject(Store);

  loadAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadAllUsers),
      exhaustMap(() =>
        this.api.get<User[]>('api/user/').pipe(
          map((users) => UsersActions.loadAllUsersSuccess({ users })),
          catchError((error) =>
            of(UsersActions.loadAllUsersFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  addUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.addUser),
      exhaustMap(({ data }) =>
        this.api.post<void>('api/user/register', data).pipe(
          map(() => {
            this.toast.success('TOAST.MEMBER_ADDED');
            return UsersActions.addUserSuccess();
          }),
          catchError((error) => {
            this.toast.error(error?.error?.message ?? 'TOAST.MEMBER_ADD_ERROR');
            return of(UsersActions.addUserFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  reloadAfterAdd$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.addUserSuccess),
      map(() => UsersActions.loadAllUsers()),
    ),
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.deleteUser),
      exhaustMap(({ id }) =>
        this.api.delete<void>(`api/user/${id}`).pipe(
          map(() => {
            this.toast.success('TOAST.MEMBER_DELETED');
            return UsersActions.deleteUserSuccess({ id });
          }),
          catchError((error) => {
            this.toast.error('TOAST.MEMBER_DELETE_ERROR');
            return of(UsersActions.deleteUserFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.updateUser),
      exhaustMap(({ id, data }) =>
        this.api.put<void>(`api/user/${id}`, data).pipe(
          map(() => {
            this.toast.success('TOAST.MEMBER_UPDATED');
            return UsersActions.updateUserSuccess({ id, data });
          }),
          catchError((error) => {
            this.toast.error('TOAST.MEMBER_UPDATE_ERROR');
            return of(UsersActions.updateUserFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  updateRoles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.updateRoles),
      switchMap(({ id, roles }) =>
        this.store.select(selectAllUsers).pipe(
          take(1),
          switchMap((users) => {
            const previous = users.find((user) => user._id === id)?.roles ?? [];
            return this.api.put<void>(`api/user/${id}/roles`, { roles }).pipe(
              map(() => {
                this.toast.success('TOAST.MEMBER_ROLES_UPDATED');
                return UsersActions.updateRolesSuccess({ id, roles });
              }),
              catchError((error) => {
                this.toast.error('TOAST.MEMBER_ROLES_UPDATE_ERROR');
                return of(
                  UsersActions.updateRolesFailure({
                    id,
                    previousRoles:
                      previous as import('../../../../shared/constants/roles/roles.constants').Role[],
                    error: error?.message ?? 'Erreur',
                  }),
                );
              }),
            );
          }),
        ),
      ),
    ),
  );

  uploadPicture$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.uploadPicture),
      exhaustMap(({ formData }) =>
        this.api.postFormData<User>('api/user/upload', formData).pipe(
          map((user) => {
            this.toast.success('TOAST.PROFILE_PHOTO_UPDATED');
            return UsersActions.uploadPictureSuccess({ user });
          }),
          catchError((error) => {
            this.toast.error('TOAST.PROFILE_PHOTO_ERROR');
            return of(UsersActions.uploadPictureFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );
}
