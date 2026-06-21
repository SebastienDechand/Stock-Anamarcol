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
import { authInterceptor } from './core/auth/auth.interceptor';
import { authReducer } from './store/auth/auth.reducer';
import { uiReducer } from './store/ui/ui.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { AuthActions } from './store/auth/auth.actions';
import { selectAuthStatus } from './store/auth/auth.selectors';

import { itemsReducer } from './features/articles/store/items.reducer';
import { ItemsEffects } from './features/articles/store/items.effects';
import { ItemsActions } from './features/articles/store/items.actions';

import { usersReducer } from './features/membres/store/users.reducer';
import { UsersEffects } from './features/membres/store/users.effects';
import { UsersActions } from './features/membres/store/users.actions';

import { contactsReducer } from './features/contacts/store/contacts.reducer';
import { ContactsEffects } from './features/contacts/store/contacts.effects';
import { ContactsActions } from './features/contacts/store/contacts.actions';

import { vehiclesReducer } from './features/flotte/store/vehicles.reducer';
import { VehiclesEffects } from './features/flotte/store/vehicles.effects';
import { VehiclesActions } from './features/flotte/store/vehicles.actions';

import { shipmentsReducer } from './features/envois/store/shipments.reducer';
import { ShipmentsEffects } from './features/envois/store/shipments.effects';
import { ShipmentsActions } from './features/envois/store/shipments.actions';

import { clientFilesReducer } from './features/fiches-clients/store/client-files.reducer';
import { ClientFilesEffects } from './features/fiches-clients/store/client-files.effects';
import { ClientFilesActions } from './features/fiches-clients/store/client-files.actions';

import { rapportsReducer } from './features/rapports-intervention/store/rapports.reducer';
import { RapportsEffects } from './features/rapports-intervention/store/rapports.effects';
import { RapportsActions } from './features/rapports-intervention/store/rapports.actions';

import { statisticsReducer } from './features/home/store/statistics.reducer';
import { StatisticsEffects } from './features/home/store/statistics.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({ lang: 'fr', fallbackLang: 'fr' }),
    ...provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
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
      rapports: rapportsReducer,
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
      RapportsEffects,
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
            store.dispatch(ItemsActions.loadAllItems());
            store.dispatch(UsersActions.loadAllUsers());
            store.dispatch(ContactsActions.loadAll());
            store.dispatch(VehiclesActions.loadAll());
            store.dispatch(ClientFilesActions.loadAll());
            store.dispatch(RapportsActions.loadAll());
            store.dispatch(ShipmentsActions.fetchShipments({ params: { page: 1, limit: 200 } }));
          });
      },
      deps: [Store],
      multi: true,
    },
  ],
};
