import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/login/login.routes').then((m) => m.loginRoutes),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadChildren: () => import('./features/home/home.routes').then((m) => m.homeRoutes),
      },
      {
        path: 'articles',
        loadChildren: () =>
          import('./features/articles/articles.routes').then((m) => m.articlesRoutes),
      },
      {
        path: 'membres',
        loadChildren: () =>
          import('./features/membres/membres.routes').then((m) => m.membresRoutes),
      },
      {
        path: 'contacts',
        loadChildren: () =>
          import('./features/contacts/contacts.routes').then((m) => m.contactsRoutes),
      },
      {
        path: 'profil',
        loadChildren: () => import('./features/profil/profil.routes').then((m) => m.profilRoutes),
      },
      {
        path: 'envois',
        canActivate: [roleGuard('hotline')],
        loadChildren: () => import('./features/envois/envois.routes').then((m) => m.envoisRoutes),
      },
      {
        path: 'fiches-clients',
        canActivate: [roleGuard('monteur')],
        loadChildren: () =>
          import('./features/fiches-clients/fiches-clients.routes').then(
            (m) => m.fichesClientsRoutes,
          ),
      },
      {
        path: 'rapports-intervention',
        canActivate: [roleGuard('monteur')],
        loadChildren: () =>
          import('./features/rapports-intervention/rapports-intervention.routes').then(
            (m) => m.rapportsRoutes,
          ),
      },
      {
        path: 'flotte',
        canActivate: [roleGuard('admin')],
        loadChildren: () => import('./features/flotte/flotte.routes').then((m) => m.flotteRoutes),
      },
      {
        path: 'surveillance',
        canActivate: [roleGuard('admin')],
        loadChildren: () =>
          import('./features/surveillance/surveillance.routes').then((m) => m.surveillanceRoutes),
      },
      {
        path: 'history',
        canActivate: [roleGuard('admin')],
        loadChildren: () =>
          import('./features/history/history.routes').then((m) => m.historyRoutes),
      },
      {
        path: 'admin/roles',
        canActivate: [roleGuard('superadmin')],
        loadChildren: () =>
          import('./features/admin-roles/admin-roles.routes').then((m) => m.adminRolesRoutes),
      },
      {
        path: 'legal',
        loadChildren: () => import('./features/legal/legal.routes').then((m) => m.legalRoutes),
      },
    ],
  },
  {
    path: '**',
    loadChildren: () =>
      import('./features/not-found/not-found.routes').then((m) => m.notFoundRoutes),
  },
];
