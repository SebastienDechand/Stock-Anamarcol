import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/toast/toast.service';
import { AuthActions } from './auth.actions';

function loginErrorMessage(err: unknown, translate: TranslateService): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 429 && err.error?.message) {
      return err.error.message;
    }
    if (err.status === 0 || [500, 502, 503, 504].includes(err.status)) {
      return translate.instant('LOGIN.SERVER_ERROR');
    }
    return translate.instant('LOGIN.INVALID_CREDENTIALS');
  }
  return translate.instant('LOGIN.UNEXPECTED_ERROR');
}

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  checkSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkSession),
      exhaustMap(() =>
        this.authService.checkSession().pipe(
          map(({ uid, roles }) => AuthActions.checkSessionSuccess({ uid, roles })),
          catchError(() => of(AuthActions.checkSessionFailure())),
        ),
      ),
    ),
  );

  loadUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkSessionSuccess),
      switchMap(({ uid }) =>
        this.authService.getUserProfile(uid).pipe(
          map((user) => AuthActions.loadUserProfileSuccess({ user })),
          catchError(() => of(AuthActions.loadUserProfileFailure())),
        ),
      ),
    ),
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          map(() => AuthActions.loginSuccess()),
          catchError((err) =>
            of(AuthActions.loginFailure({ error: loginErrorMessage(err, this.translate) })),
          ),
        ),
      ),
    ),
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => {
        this.router.navigate(['/home']);
      }),
      switchMap(() =>
        this.authService.checkSession().pipe(
          map(({ uid, roles }) => AuthActions.checkSessionSuccess({ uid, roles })),
          catchError(() => of(AuthActions.checkSessionFailure())),
        ),
      ),
    ),
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess())),
        ),
      ),
    ),
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => this.router.navigate(['/'])),
      ),
    { dispatch: false },
  );

  updateUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.updateUserProfile),
      exhaustMap(({ uid, data }) =>
        this.authService.updateUserProfile(uid, data).pipe(
          map((user) => AuthActions.updateUserProfileSuccess({ user })),
          catchError(() => {
            this.toast.error('TOAST.PROFILE_UPDATE_ERROR');
            return of(AuthActions.loadUserProfileFailure());
          }),
        ),
      ),
    ),
  );
}
