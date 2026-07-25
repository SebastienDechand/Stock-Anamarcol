import { createReducer, on } from '@ngrx/store';
import { ContactsActions } from '../actions/contacts.actions';
import { initialContactsState } from '../state/contacts.state';

export const contactsReducer = createReducer(
  initialContactsState,

  on(ContactsActions.loadAll, (state) => ({ ...state, isLoading: true })),
  on(ContactsActions.loadAllSuccess, (state, { contacts }) => ({
    ...state,
    contacts,
    loaded: true,
    isLoading: false,
    error: null,
  })),
  on(ContactsActions.loadAllFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(ContactsActions.loadOneSuccess, (state, { contact }) => ({
    ...state,
    selectedContact: contact,
  })),

  on(ContactsActions.updateContactSuccess, (state, { contact }) => ({
    ...state,
    contacts: state.contacts.map((existing) => (existing._id === contact._id ? contact : existing)),
    selectedContact: contact,
  })),

  on(ContactsActions.uploadPictureSuccess, (state, { contact }) => ({
    ...state,
    contacts: state.contacts.map((existing) => (existing._id === contact._id ? contact : existing)),
    selectedContact: state.selectedContact?._id === contact._id ? contact : state.selectedContact,
  })),

  on(ContactsActions.setSelectedId, (state, { id }) => ({
    ...state,
    selectedContactId: id,
    selectedContact: id ? (state.contacts.find((existing) => existing._id === id) ?? null) : null,
  })),
);
