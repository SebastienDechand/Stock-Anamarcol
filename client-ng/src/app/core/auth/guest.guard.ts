import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthFacade } from '../../store/auth/auth.facade';

/**
 * Prevents an already-authenticated user from seeing the login page again —
 * redirects to /home instead (mirrors React's inline `<Navigate to="/home" />` check).
 */
export const guestGuard: CanActivateFn = () => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  return authFacade.status$.pipe(
    filter((status) => status !== 'loading' && status !== 'idle'),
    take(1),
    map((status) => (status === 'authenticated' ? router.createUrlTree(['/home']) : true)),
  );
};
