import { Routes } from '@angular/router';
import { FichesClientsPage } from './fiches-clients-page';
import { DossierClientPage } from './dossier-client-page';

export const fichesClientsRoutes: Routes = [
  { path: '', component: FichesClientsPage },
  { path: ':id', component: DossierClientPage },
];
