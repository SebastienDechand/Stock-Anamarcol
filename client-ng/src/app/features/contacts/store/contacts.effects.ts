import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/toast/toast.service';
import { Contact } from '../../../shared/models/contact.model';
import { ContactsActions } from './contacts.actions';

@Injectable()
export class ContactsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loadAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContactsActions.loadAll),
      exhaustMap(() =>
        this.api.get<Contact[]>('api/contacts/').pipe(
          map((contacts) => ContactsActions.loadAllSuccess({ contacts })),
          catchError((error) =>
            of(ContactsActions.loadAllFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  loadOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContactsActions.loadOne),
      switchMap(({ id }) =>
        this.api.get<Contact>(`api/contacts/${id}`).pipe(
          map((contact) => ContactsActions.loadOneSuccess({ contact })),
          catchError((error) =>
            of(ContactsActions.loadOneFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContactsActions.updateContact),
      exhaustMap(({ id, data }) =>
        this.api.put<Contact>(`api/contacts/${id}`, data).pipe(
          map((contact) => {
            this.toast.success('TOAST.CONTACT_UPDATED');
            return ContactsActions.updateContactSuccess({ contact });
          }),
          catchError((error) => {
            this.toast.error('TOAST.CONTACT_UPDATE_ERROR');
            return of(ContactsActions.updateContactFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  uploadPicture$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContactsActions.uploadPicture),
      exhaustMap(({ id, formData }) =>
        this.api.post<void>('api/contacts/upload', formData).pipe(
          switchMap(() => this.api.get<Contact>(`api/contacts/${id}`)),
          map((contact) => {
            this.toast.success('TOAST.CONTACT_PHOTO_UPDATED');
            return ContactsActions.uploadPictureSuccess({ contact });
          }),
          catchError((error) => {
            this.toast.error('TOAST.CONTACT_PHOTO_ERROR');
            return of(ContactsActions.uploadPictureFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );
}
