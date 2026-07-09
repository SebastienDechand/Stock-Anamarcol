import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { combineLatest, filter, map, take } from 'rxjs';
import { AuthFacade } from '../../store/auth/auth.facade';

export type RequiredRole = 'admin' | 'superadmin' | 'hotline' | 'monteur';

export function roleGuard(required: RequiredRole): CanActivateFn {
  return () => {
    const authFacade = inject(AuthFacade);
    const router = inject(Router);

    const hasRole$ = {
      admin: authFacade.isAdmin$,
      superadmin: authFacade.isSuperadmin$,
      hotline: authFacade.isHotline$,
      monteur: authFacade.isMonteur$,
    }[required];

    return combineLatest([authFacade.status$, hasRole$]).pipe(
      filter(([status]) => status !== 'loading' && status !== 'idle'),
      take(1),
      map(([, hasRole]) => (hasRole ? true : router.createUrlTree(['/home']))),
    );
  };
}
