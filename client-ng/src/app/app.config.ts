import {
  APP_INITIALIZER,
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { LUCIDE_ICONS, LucideIconProvider, LucideIconData } from 'lucide-angular';
import * as allLucideIcons from 'lucide-angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
} from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { importProvidersFrom } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';
import { filter, take } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor/auth.interceptor';
import { authReducer } from './store/auth/reducer/auth.reducer';
import { uiReducer } from './store/ui/reducer/ui.reducer';
import { AuthEffects } from './store/auth/effects/auth.effects';
import { AuthActions } from './store/auth/actions/auth.actions';
import { selectAuthStatus } from './store/auth/selectors/auth.selectors';

import { itemsReducer } from './features/items/store/reducer/items.reducer';
import { ItemsEffects } from './features/items/store/effects/items.effects';

import { usersReducer } from './features/members/store/reducer/users.reducer';
import { UsersEffects } from './features/members/store/effects/users.effects';
import { UsersActions } from './features/members/store/actions/users.actions';

import { contactsReducer } from './features/contacts/store/reducer/contacts.reducer';
import { ContactsEffects } from './features/contacts/store/effects/contacts.effects';
import { ContactsActions } from './features/contacts/store/actions/contacts.actions';

import { vehiclesReducer } from './features/fleet/store/reducer/vehicles.reducer';
import { VehiclesEffects } from './features/fleet/store/effects/vehicles.effects';
import { VehiclesActions } from './features/fleet/store/actions/vehicles.actions';

import { shipmentsReducer } from './features/shipments/store/reducer/shipments.reducer';
import { ShipmentsEffects } from './features/shipments/store/effects/shipments.effects';
import { ShipmentsActions } from './features/shipments/store/actions/shipments.actions';

import { clientFilesReducer } from './features/client-files/store/reducer/client-files.reducer';
import { ClientFilesEffects } from './features/client-files/store/effects/client-files.effects';
import { ClientFilesActions } from './features/client-files/store/actions/client-files.actions';

import { interventionReportsReducer } from './features/intervention-reports/store/reducer/intervention-reports.reducer';
import { InterventionReportsEffects } from './features/intervention-reports/store/effects/intervention-reports.effects';
import { InterventionReportsActions } from './features/intervention-reports/store/actions/intervention-reports.actions';

import { statisticsReducer } from './features/home/store/reducer/statistics.reducer';
import { StatisticsEffects } from './features/home/store/effects/statistics.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({ lang: 'fr', fallbackLang: 'fr' }),
    ...provideTranslateHttpLoader({ prefix: 'i18n/', suffix: '.json' }),
    provideAnimations(),

    provideStore({
      auth: authReducer,
      ui: uiReducer,
      items: itemsReducer,
      users: usersReducer,
      contacts: contactsReducer,
      vehicles: vehiclesReducer,
      shipments: shipmentsReducer,
      clientFiles: clientFilesReducer,
      interventionReports: interventionReportsReducer,
      statistics: statisticsReducer,
    }),
    provideEffects(
      AuthEffects,
      ItemsEffects,
      UsersEffects,
      ContactsEffects,
      VehiclesEffects,
      ShipmentsEffects,
      ClientFilesEffects,
      InterventionReportsEffects,
      StatisticsEffects,
    ),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),

    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(allLucideIcons as unknown as Record<string, LucideIconData>),
    },

    importProvidersFrom(
      ToastrModule.forRoot({
        positionClass: 'toast-top-right',
        timeOut: 3000,
        progressBar: true,
        preventDuplicates: true,
      }),
    ),

    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store) => () => {
        store.dispatch(AuthActions.checkSession());
        return store.select(selectAuthStatus).pipe(
          filter((status) => status !== 'idle' && status !== 'loading'),
          take(1),
        );
      },
      deps: [Store],
      multi: true,
    },

    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store) => () => {
        store
          .select(selectAuthStatus)
          .pipe(
            filter((status) => status === 'authenticated'),
            take(1),
          )
          .subscribe(() => {
            store.dispatch(UsersActions.loadAllUsers());
            store.dispatch(ContactsActions.loadAll());
            store.dispatch(VehiclesActions.loadAll());
            store.dispatch(ClientFilesActions.loadAll());
            store.dispatch(InterventionReportsActions.loadAll());
            store.dispatch(ShipmentsActions.fetchShipments({ params: { page: 1, limit: 200 } }));
          });
      },
      deps: [Store],
      multi: true,
    },
  ],
};
