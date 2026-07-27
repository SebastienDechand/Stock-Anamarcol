import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ContactsPage } from './contacts-page';
import { ContactsFacade } from './store/facade/contacts.facade';
import { selectSelectedContact } from './store/selectors/contacts.selectors';
import { initialContactsState } from './store/state/contacts.state';
import { initialAuthState } from '../../store/auth/state/auth.state';
import type { Contact } from '../../shared/models/contact/contact.model';

const initialState = { contacts: initialContactsState, auth: initialAuthState };

const mockContact: Contact = {
  _id: 'contact-1',
  name: 'Dupont',
  email: 'dupont@example.com',
  position: 'Développeur',
};

describe('ContactsPage', () => {
  let component: ContactsPage;
  let facade: ContactsFacade;
  let store: MockStore;

  function setSelectedContact(contact: Contact | null): void {
    store.overrideSelector(selectSelectedContact, contact);
    store.refreshState();
  }

  beforeEach(async () => {
    TestBed.overrideComponent(ContactsPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [ContactsPage],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    facade = TestBed.inject(ContactsFacade);
    store = TestBed.inject(MockStore);

    const fixture = TestBed.createComponent(ContactsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    store.resetSelectors();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('openModal', () => {
    it('should call facade.loadOne with contact._id', () => {
      vi.spyOn(facade, 'loadOne').mockImplementation(() => {});

      component.openModal(mockContact);

      expect(facade.loadOne).toHaveBeenCalledWith('contact-1');
    });

    it('should read editingContact from the store once loadOne resolves', () => {
      vi.spyOn(facade, 'loadOne').mockImplementation(() => {});

      component.openModal(mockContact);
      setSelectedContact(mockContact);

      expect(component.editingContact()).toBe(mockContact);
    });

    it('should reflect store updates to the selected contact while the modal stays open (e.g. after a picture upload)', () => {
      vi.spyOn(facade, 'loadOne').mockImplementation(() => {});

      component.openModal(mockContact);
      setSelectedContact(mockContact);
      expect(component.editingContact()).toBe(mockContact);

      const withNewPicture: Contact = { ...mockContact, picture: 'uploads/new.jpg' };
      setSelectedContact(withNewPicture);

      expect(component.editingContact()).toBe(withNewPicture);
    });

    it('should not show a contact when the modal has not been opened', () => {
      setSelectedContact(mockContact);

      expect(component.editingContact()).toBeNull();
    });

    it('should show the newly clicked contact immediately, even if the store still holds a previously edited contact', () => {
      vi.spyOn(facade, 'loadOne').mockImplementation(() => {});
      const otherContact: Contact = { _id: 'contact-2', name: 'Martin', email: 'martin@example.com' };

      // Simulate a previous edit session (e.g. editing another contact) leaving its
      // data in the store's selectedContact until loadOne resolves for the new one.
      setSelectedContact(otherContact);

      component.openModal(mockContact);

      expect(component.editingContact()).toBe(mockContact);
    });
  });

  describe('onSave', () => {
    it('should call facade.update with contact id and data when editingContact is set', () => {
      const updateData: Partial<Contact> = { name: 'Dupont Modifié' };
      vi.spyOn(facade, 'loadOne').mockImplementation(() => {});
      vi.spyOn(facade, 'update').mockImplementation(() => {});

      component.openModal(mockContact);
      setSelectedContact(mockContact);
      component.onSave(updateData);

      expect(facade.update).toHaveBeenCalledWith('contact-1', updateData);
    });

    it('should reset editingContact to null after saving', () => {
      vi.spyOn(facade, 'loadOne').mockImplementation(() => {});
      vi.spyOn(facade, 'update').mockImplementation(() => {});

      component.openModal(mockContact);
      setSelectedContact(mockContact);
      component.onSave({ name: 'Dupont Modifié' });

      expect(component.editingContact()).toBeNull();
    });

    it('should do nothing when editingContact is null', () => {
      vi.spyOn(facade, 'update').mockImplementation(() => {});

      component.onSave({ name: 'Dupont Modifié' });

      expect(facade.update).not.toHaveBeenCalled();
    });
  });

  describe('onPictureUpload', () => {
    it('should call facade.uploadPicture with id and formData', () => {
      const formData = new FormData();
      const event = { id: 'contact-1', formData };
      vi.spyOn(facade, 'uploadPicture').mockImplementation(() => {});

      component.onPictureUpload(event);

      expect(facade.uploadPicture).toHaveBeenCalledWith('contact-1', formData);
    });
  });
});
