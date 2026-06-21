import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { AuthEffects } from '../auth.effects';
import { AuthActions } from '../auth.actions';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';

describe('AuthEffects', () => {
  let effects: AuthEffects;
  let actions$: Subject<Action>;
  let authService: {
    login: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    actions$ = new Subject<Action>();

    authService = {
      login: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
      ],
    });

    effects = TestBed.inject(AuthEffects);
  });

  describe('login$', () => {
    it('should dispatch loginSuccess on success', async () => {
      authService.login.mockReturnValue(of(undefined));

      const promise = firstValueFrom(effects.login$);
      actions$.next(AuthActions.login({ email: 'a@b.com', password: 'secret' }));
      const result = await promise;

      expect(result).toEqual(AuthActions.loginSuccess());
    });

    it('should surface the server message on a 429 rate-limit error', async () => {
      const err = new HttpErrorResponse({
        status: 429,
        error: { message: 'Trop de tentatives, réessayez plus tard.' },
      });
      authService.login.mockReturnValue(throwError(() => err));

      const promise = firstValueFrom(effects.login$);
      actions$.next(AuthActions.login({ email: 'a@b.com', password: 'secret' }));
      const result = await promise;

      expect(result).toEqual(
        AuthActions.loginFailure({ error: 'Trop de tentatives, réessayez plus tard.' }),
      );
    });

    it.each([0, 500, 502, 503, 504])(
      'should show a server-unavailable message on status %d',
      async (status) => {
        const err = new HttpErrorResponse({ status });
        authService.login.mockReturnValue(throwError(() => err));

        const promise = firstValueFrom(effects.login$);
        actions$.next(AuthActions.login({ email: 'a@b.com', password: 'secret' }));
        const result = await promise;

        expect(result).toEqual(
          AuthActions.loginFailure({
            error: 'LOGIN.SERVER_ERROR',
          }),
        );
      },
    );

    it('should show a wrong-credentials message on a 401 error', async () => {
      const err = new HttpErrorResponse({ status: 401 });
      authService.login.mockReturnValue(throwError(() => err));

      const promise = firstValueFrom(effects.login$);
      actions$.next(AuthActions.login({ email: 'a@b.com', password: 'wrong' }));
      const result = await promise;

      expect(result).toEqual(AuthActions.loginFailure({ error: 'LOGIN.INVALID_CREDENTIALS' }));
    });
  });
});
