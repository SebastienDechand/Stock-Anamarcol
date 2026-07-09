import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'items',
        loadComponent: () => import('./features/items/items-page').then((m) => m.ItemsPage),
      },
      {
        path: 'members',
        loadComponent: () => import('./features/members/members-page').then((m) => m.MembersPage),
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('./features/contacts/contacts-page').then((m) => m.ContactsPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'shipments',
        canActivate: [roleGuard('hotline')],
        loadComponent: () =>
          import('./features/shipments/shipments-page').then((m) => m.ShipmentsPage),
      },
      {
        path: 'client-files',
        canActivate: [roleGuard('monteur')],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/client-files/client-files-page').then((m) => m.ClientFilesPage),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/client-files/client-file-detail-page').then(
                (m) => m.ClientFileDetailPage,
              ),
          },
        ],
      },
      {
        path: 'intervention-reports',
        canActivate: [roleGuard('monteur')],
        loadComponent: () =>
          import('./features/intervention-reports/intervention-reports-page').then(
            (m) => m.InterventionReportsPage,
          ),
      },
      {
        path: 'fleet',
        canActivate: [roleGuard('admin')],
        loadComponent: () => import('./features/fleet/fleet-page').then((m) => m.FleetPage),
      },
      {
        path: 'surveillance',
        canActivate: [roleGuard('admin')],
        loadComponent: () =>
          import('./features/surveillance/surveillance-page').then((m) => m.SurveillancePage),
      },
      {
        path: 'history',
        canActivate: [roleGuard('admin')],
        loadComponent: () => import('./features/history/history-page').then((m) => m.HistoryPage),
      },
      {
        path: 'admin/roles',
        canActivate: [roleGuard('superadmin')],
        loadComponent: () =>
          import('./features/admin-roles/admin-roles-page').then((m) => m.AdminRolesPage),
      },
      {
        path: 'legal',
        loadComponent: () => import('./features/legal/legal-page').then((m) => m.LegalPage),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
