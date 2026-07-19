import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { ContactsPage } from '../contacts-page';
import { ContactsFacade } from '../store/contacts.facade';
import { initialContactsState } from '../store/contacts.state';
import { initialAuthState } from '../../../store/auth/auth.state';
import type { Contact } from '../../../shared/models/contact.model';

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

  beforeEach(async () => {
    TestBed.overrideComponent(ContactsPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [ContactsPage],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    facade = TestBed.inject(ContactsFacade);

    const fixture = TestBed.createComponent(ContactsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
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

    it('should set editingContact signal to the contact', () => {
      vi.spyOn(facade, 'loadOne').mockImplementation(() => {});

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
      component.onSave(updateData);

      expect(facade.update).toHaveBeenCalledWith('contact-1', updateData);
    });

    it('should reset editingContact to null after saving', () => {
      vi.spyOn(facade, 'loadOne').mockImplementation(() => {});
      vi.spyOn(facade, 'update').mockImplementation(() => {});

      component.openModal(mockContact);
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
