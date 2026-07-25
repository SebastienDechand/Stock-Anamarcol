import { Contact } from '../../../../shared/models/contact/contact.model';

export interface ContactsState {
  contacts: Contact[];
  selectedContactId: string | null;
  selectedContact: Contact | null;
  loaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialContactsState: ContactsState = {
  contacts: [],
  selectedContactId: null,
  selectedContact: null,
  loaded: false,
  isLoading: false,
  error: null,
};
