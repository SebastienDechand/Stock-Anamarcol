import { describe, it, expect } from 'vitest';
import { contactsReducer } from './contacts.reducer';
import { ContactsActions } from '../actions/contacts.actions';
import { initialContactsState } from '../state/contacts.state';
import type { Contact } from '../../../../shared/models/contact/contact.model';

const sampleContact: Contact = {
  _id: '1',
  name: 'Dupont',
  email: 'dupont@example.com',
  position: 'Technicien',
  phone: '0600000001',
};

const otherContact: Contact = {
  _id: '2',
  name: 'Martin',
  email: 'martin@example.com',
};

describe('contactsReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = contactsReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialContactsState);
  });

  it('should handle loadAll by setting isLoading to true', () => {
    const state = contactsReducer(initialContactsState, ContactsActions.loadAll());
    expect(state.isLoading).toBe(true);
  });

  it('should handle loadAllSuccess', () => {
    const state = contactsReducer(
      { ...initialContactsState, isLoading: true },
      ContactsActions.loadAllSuccess({ contacts: [sampleContact] }),
    );
    expect(state.contacts).toEqual([sampleContact]);
    expect(state.loaded).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle loadAllFailure', () => {
    const state = contactsReducer(
      { ...initialContactsState, isLoading: true },
      ContactsActions.loadAllFailure({ error: 'Erreur réseau' }),
    );
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Erreur réseau');
  });

  it('should handle loadOneSuccess by setting selectedContact', () => {
    const state = contactsReducer(
      initialContactsState,
      ContactsActions.loadOneSuccess({ contact: sampleContact }),
    );
    expect(state.selectedContact).toEqual(sampleContact);
  });

  it('should handle updateContactSuccess by replacing in list and updating selectedContact', () => {
    const updated: Contact = { ...sampleContact, name: 'Dupont Modifié' };
    const state = contactsReducer(
      {
        ...initialContactsState,
        contacts: [sampleContact, otherContact],
        selectedContact: sampleContact,
      },
      ContactsActions.updateContactSuccess({ contact: updated }),
    );
    expect(state.contacts).toEqual([updated, otherContact]);
    expect(state.selectedContact).toEqual(updated);
  });

  it('should handle updateContactSuccess without touching unrelated contacts', () => {
    const updated: Contact = { ...sampleContact, name: 'Dupont Modifié' };
    const state = contactsReducer(
      { ...initialContactsState, contacts: [sampleContact, otherContact] },
      ContactsActions.updateContactSuccess({ contact: updated }),
    );
    expect(state.contacts.find((c) => c._id === '2')).toEqual(otherContact);
  });

  it('should handle uploadPictureSuccess by updating contacts list', () => {
    const withPicture: Contact = { ...sampleContact, picture: 'avatar.png' };
    const state = contactsReducer(
      { ...initialContactsState, contacts: [sampleContact, otherContact] },
      ContactsActions.uploadPictureSuccess({ contact: withPicture }),
    );
    expect(state.contacts.find((c) => c._id === '1')).toEqual(withPicture);
    expect(state.contacts.find((c) => c._id === '2')).toEqual(otherContact);
  });

  it('should handle uploadPictureSuccess by updating selectedContact when it matches', () => {
    const withPicture: Contact = { ...sampleContact, picture: 'avatar.png' };
    const state = contactsReducer(
      {
        ...initialContactsState,
        contacts: [sampleContact],
        selectedContact: sampleContact,
      },
      ContactsActions.uploadPictureSuccess({ contact: withPicture }),
    );
    expect(state.selectedContact).toEqual(withPicture);
  });

  it('should handle uploadPictureSuccess without changing selectedContact when it does not match', () => {
    const withPicture: Contact = { ...sampleContact, picture: 'avatar.png' };
    const state = contactsReducer(
      {
        ...initialContactsState,
        contacts: [sampleContact],
        selectedContact: otherContact,
      },
      ContactsActions.uploadPictureSuccess({ contact: withPicture }),
    );
    expect(state.selectedContact).toEqual(otherContact);
  });

  it('should handle setSelectedId by setting selectedContactId and finding contact in list', () => {
    const state = contactsReducer(
      { ...initialContactsState, contacts: [sampleContact, otherContact] },
      ContactsActions.setSelectedId({ id: '1' }),
    );
    expect(state.selectedContactId).toBe('1');
    expect(state.selectedContact).toEqual(sampleContact);
  });

  it('should handle setSelectedId with null by clearing selection', () => {
    const state = contactsReducer(
      {
        ...initialContactsState,
        contacts: [sampleContact],
        selectedContactId: '1',
        selectedContact: sampleContact,
      },
      ContactsActions.setSelectedId({ id: null }),
    );
    expect(state.selectedContactId).toBeNull();
    expect(state.selectedContact).toBeNull();
  });
});
