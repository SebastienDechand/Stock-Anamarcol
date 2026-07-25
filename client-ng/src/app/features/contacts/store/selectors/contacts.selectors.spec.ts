import { describe, it, expect } from 'vitest';
import {
  selectAllContacts,
  selectSelectedContact,
  selectSelectedContactId,
  selectContactsLoading,
  selectContactsLoaded,
  selectExterieurs,
  selectFournisseurs,
} from './contacts.selectors';
import { initialContactsState } from '../state/contacts.state';
import type { Contact } from '../../../../shared/models/contact/contact.model';

const makeContact = (
  id: string,
  name: string,
  category?: Contact['category'],
): Contact => ({
  _id: id,
  name,
  email: `${name.toLowerCase()}@example.com`,
  category,
});

const contacts: Contact[] = [
  makeContact('1', 'Dupont', 'external'),
  makeContact('2', 'Martin', 'external'),
  makeContact('3', 'Bernard', 'supplier'),
  makeContact('4', 'Moreau', 'supplier'),
  makeContact('5', 'Simon', 'external'),
  makeContact('6', 'Laurent', 'supplier'),
  makeContact('7', 'Michel', 'external'),
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

    it('should return only contacts categorized as external', () => {
      const state = { contacts: { ...initialContactsState, contacts } };
      expect(selectExterieurs(state)).toEqual(
        contacts.filter((c) => c.category === 'external'),
      );
    });

    it('should treat contacts with no category as external', () => {
      const uncategorized = makeContact('8', 'Petit');
      const state = {
        contacts: { ...initialContactsState, contacts: [uncategorized] },
      };
      expect(selectExterieurs(state)).toEqual([uncategorized]);
    });
  });

  describe('selectFournisseurs', () => {
    it('should return empty array from initial state', () => {
      const state = { contacts: initialContactsState };
      expect(selectFournisseurs(state)).toEqual([]);
    });

    it('should return only contacts categorized as supplier', () => {
      const state = { contacts: { ...initialContactsState, contacts } };
      expect(selectFournisseurs(state)).toEqual(
        contacts.filter((c) => c.category === 'supplier'),
      );
    });

    it('should not include uncategorized contacts', () => {
      const uncategorized = makeContact('8', 'Petit');
      const state = {
        contacts: { ...initialContactsState, contacts: [uncategorized] },
      };
      expect(selectFournisseurs(state)).toEqual([]);
    });
  });
});
