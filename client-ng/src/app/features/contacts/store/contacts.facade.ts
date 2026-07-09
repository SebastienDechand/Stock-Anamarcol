import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { Contact } from '../../../shared/models/contact.model';
import { ContactsActions } from './contacts.actions';
import {
  selectAllContacts,
  selectContactsLoaded,
  selectContactsLoading,
  selectExterieurs,
  selectFournisseurs,
  selectSelectedContact,
  selectSelectedContactId,
} from './contacts.selectors';

@Injectable({ providedIn: 'root' })
export class ContactsFacade {
  private store = inject(Store);

  contacts$ = this.store.select(selectAllContacts);
  exterieurs$ = this.store.select(selectExterieurs);
  fournisseurs$ = this.store.select(selectFournisseurs);
  selectedContact$ = this.store.select(selectSelectedContact);
  selectedContactId$ = this.store.select(selectSelectedContactId);
  isLoading$ = combineLatest([
    this.store.select(selectContactsLoading),
    this.store.select(selectContactsLoaded),
  ]).pipe(map(([loading, loaded]) => loading && !loaded));

  loadAll() {
    this.store.dispatch(ContactsActions.loadAll());
  }
  loadOne(id: string) {
    this.store.dispatch(ContactsActions.loadOne({ id }));
  }
  update(id: string, data: Partial<Contact>) {
    this.store.dispatch(ContactsActions.updateContact({ id, data }));
  }
  uploadPicture(id: string, formData: FormData) {
    this.store.dispatch(ContactsActions.uploadPicture({ id, formData }));
  }
  setSelectedId(id: string | null) {
    this.store.dispatch(ContactsActions.setSelectedId({ id }));
  }
}
