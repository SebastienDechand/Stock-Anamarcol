import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ContactsState } from './contacts.state';

export const selectContactsState = createFeatureSelector<ContactsState>('contacts');

export const selectAllContacts = createSelector(selectContactsState, (state) => state.contacts);
export const selectSelectedContact = createSelector(
  selectContactsState,
  (state) => state.selectedContact,
);
export const selectSelectedContactId = createSelector(
  selectContactsState,
  (state) => state.selectedContactId,
);
export const selectContactsLoading = createSelector(
  selectContactsState,
  (state) => state.isLoading,
);
export const selectContactsLoaded = createSelector(selectContactsState, (state) => state.loaded);
export const selectExterieurs = createSelector(selectAllContacts, (contacts) =>
  contacts.filter((contact) => (contact.category ?? 'external') === 'external'),
);
export const selectFournisseurs = createSelector(selectAllContacts, (contacts) =>
  contacts.filter((contact) => contact.category === 'supplier'),
);
