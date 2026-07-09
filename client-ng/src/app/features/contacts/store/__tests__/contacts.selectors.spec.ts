import { describe, it, expect } from 'vitest';
import {
  selectAllContacts,
  selectSelectedContact,
  selectSelectedContactId,
  selectContactsLoading,
  selectContactsLoaded,
  selectExterieurs,
  selectFournisseurs,
} from '../contacts.selectors';
import { initialContactsState } from '../contacts.state';
import type { Contact } from '../../../../shared/models/contact.model';

const makeContact = (id: string, nom: string): Contact => ({
  _id: id,
  nom,
  email: `${nom.toLowerCase()}@example.com`,
});

const contacts: Contact[] = [
  makeContact('1', 'Dupont'),
  makeContact('2', 'Martin'),
  makeContact('3', 'Bernard'),
  makeContact('4', 'Moreau'),
  makeContact('5', 'Simon'),
  makeContact('6', 'Laurent'),
  makeContact('7', 'Michel'),
];

describe('Contacts Selectors', () => {
  describe('selectAllContacts', () => {
    it('should return empty array from initial state', () => {
      const state = { contacts: initialContactsState };
      expect(selectAllContacts(state)).toEqual([]);
    });

    it('should return contacts when populated', () => {
      const state = { contacts: { ...initialContactsState, contacts: [contacts[0]] } };
      expect(selectAllContacts(state)).toEqual([contacts[0]]);
    });
  });

  describe('selectSelectedContact', () => {
    it('should return null from initial state', () => {
      const state = { contacts: initialContactsState };
      expect(selectSelectedContact(state)).toBeNull();
    });

    it('should return the selected contact when set', () => {
      const state = {
        contacts: { ...initialContactsState, selectedContact: contacts[0] },
      };
      expect(selectSelectedContact(state)).toEqual(contacts[0]);
    });
  });

  describe('selectSelectedContactId', () => {
    it('should return null from initial state', () => {
      const state = { contacts: initialContactsState };
      expect(selectSelectedContactId(state)).toBeNull();
    });

    it('should return the selected contact id when set', () => {
      const state = {
        contacts: { ...initialContactsState, selectedContactId: '3' },
      };
      expect(selectSelectedContactId(state)).toBe('3');
    });
  });

  describe('selectContactsLoading', () => {
    it('should return false from initial state', () => {
      const state = { contacts: initialContactsState };
      expect(selectContactsLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = { contacts: { ...initialContactsState, isLoading: true } };
      expect(selectContactsLoading(state)).toBe(true);
    });
  });

  describe('selectContactsLoaded', () => {
    it('should return false from initial state', () => {
      const state = { contacts: initialContactsState };
      expect(selectContactsLoaded(state)).toBe(false);
    });

    it('should return true when loaded', () => {
      const state = { contacts: { ...initialContactsState, loaded: true } };
      expect(selectContactsLoaded(state)).toBe(true);
    });
  });

  describe('selectExterieurs', () => {
    it('should return empty array from initial state', () => {
      const state = { contacts: initialContactsState };
      expect(selectExterieurs(state)).toEqual([]);
    });

    it('should return first 3 contacts', () => {
      const state = { contacts: { ...initialContactsState, contacts } };
      expect(selectExterieurs(state)).toEqual(contacts.slice(0, 3));
    });

    it('should return all contacts when fewer than 3', () => {
      const twoContacts = contacts.slice(0, 2);
      const state = { contacts: { ...initialContactsState, contacts: twoContacts } };
      expect(selectExterieurs(state)).toEqual(twoContacts);
    });
  });

  describe('selectFournisseurs', () => {
    it('should return empty array from initial state', () => {
      const state = { contacts: initialContactsState };
      expect(selectFournisseurs(state)).toEqual([]);
    });

    it('should return contacts at indices 3 to 5', () => {
      const state = { contacts: { ...initialContactsState, contacts } };
      expect(selectFournisseurs(state)).toEqual(contacts.slice(3, 6));
    });

    it('should return empty array when fewer than 4 contacts', () => {
      const state = { contacts: { ...initialContactsState, contacts: contacts.slice(0, 3) } };
      expect(selectFournisseurs(state)).toEqual([]);
    });
  });
});
