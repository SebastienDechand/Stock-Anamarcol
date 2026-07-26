import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs';
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

  isAuthLoading$ = this.authFacade.status$.pipe(
    map((status) => status === 'idle' || status === 'loading'),
  );
}
