import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, map, withLatestFrom } from 'rxjs';
import { AuthFacade } from './store/auth/facade/auth.facade';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private authFacade = inject(AuthFacade);
  private destroyRef = inject(DestroyRef);

  isAuthLoading$ = this.authFacade.status$.pipe(
    map((status) => status === 'idle' || status === 'loading'),
  );

  constructor() {
    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        withLatestFrom(this.authFacade.isAuthenticated$),
        filter(([, isAuthenticated]) => isAuthenticated),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.authFacade.verifySession());
  }
}
