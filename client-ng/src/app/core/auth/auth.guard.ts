import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthFacade } from '../../store/auth/auth.facade';

export const authGuard: CanActivateFn = () => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  return authFacade.status$.pipe(
    filter((status) => status !== 'loading' && status !== 'idle'),
    take(1),
    map((status) => (status === 'authenticated' ? true : router.createUrlTree(['/']))),
  );
};
