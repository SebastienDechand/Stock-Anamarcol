import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import { ContactModal } from './contact-modal';
import type { Contact } from '../../../../shared/models/contact/contact.model';

const makeContact = (overrides: Partial<Contact> = {}): Contact => ({
  _id: '1',
  name: 'Alice Dupont',
  email: 'alice@example.com',
  phone: '0600000000',
  position: 'Gérante',
  link: 'https://example.com',
  category: 'external',
  ...overrides,
});

function buildComponent(contact: Contact): ContactModal {
  TestBed.overrideComponent(ContactModal, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({ imports: [ContactModal] });
  const fixture = TestBed.createComponent(ContactModal);
  fixture.componentRef.setInput('contact', contact);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('ContactModal', () => {
  describe('ngOnInit()', () => {
    it('populates the form from the contact input', () => {
      const component = buildComponent(makeContact());
      expect(component.form.getRawValue()).toEqual({
        name: 'Alice Dupont',
        email: 'alice@example.com',
        phone: '0600000000',
        position: 'Gérante',
        link: 'https://example.com',
        category: 'external',
      });
    });

    it('falls back to empty/default values for missing optional fields', () => {
      const component = buildComponent(
        makeContact({ email: undefined, phone: undefined, category: undefined }),
      );
      expect(component.form.controls.email.value).toBe('');
      expect(component.form.controls.phone.value).toBe('');
      expect(component.form.controls.category.value).toBe('external');
    });
  });

  describe('avatarUrl', () => {
    it('returns an empty string when there is no picture', () => {
      expect(buildComponent(makeContact()).avatarUrl).toBe('');
    });

    it('returns the picture as-is when it is an absolute URL', () => {
      const url = 'https://example.com/pic.jpg';
      expect(buildComponent(makeContact({ picture: url })).avatarUrl).toBe(url);
    });

    it('prepends a leading slash to a bare relative path', () => {
      expect(buildComponent(makeContact({ picture: 'pic.jpg' })).avatarUrl).toBe('/pic.jpg');
    });
  });

  describe('initials', () => {
    it('returns the uppercased first letter of the name', () => {
      expect(buildComponent(makeContact({ name: 'bob' })).initials).toBe('B');
    });

    it('returns "?" when the name is empty', () => {
      expect(buildComponent(makeContact({ name: '' })).initials).toBe('?');
    });
  });

  describe('onFileChange()', () => {
    it('emits pictureUploaded with the contact id and a FormData carrying the file', () => {
      const component = buildComponent(makeContact());
      const spy = vi.fn();
      component.pictureUploaded.subscribe(spy);

      const file = new File(['data'], 'avatar.png', { type: 'image/png' });
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [file] });

      component.onFileChange({ target: input } as unknown as Event);

      expect(spy).toHaveBeenCalledWith({
        id: '1',
        formData: expect.any(FormData),
      });
    });

    it('does nothing when no file is selected', () => {
      const component = buildComponent(makeContact());
      const spy = vi.fn();
      component.pictureUploaded.subscribe(spy);

      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [] });

      component.onFileChange({ target: input } as unknown as Event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('submit()', () => {
    it('does not emit and marks the form as touched when the name is blank', () => {
      const component = buildComponent(makeContact({ name: '' }));
      const spy = vi.fn();
      component.saved.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.form.controls.name.touched).toBe(true);
    });

    it('does not emit when the email format is invalid', () => {
      const component = buildComponent(makeContact({ email: 'not-an-email' }));
      const spy = vi.fn();
      component.saved.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('does not emit when the phone format is invalid', () => {
      const component = buildComponent(makeContact({ phone: '123' }));
      const spy = vi.fn();
      component.saved.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits saved with the form value when everything is valid', () => {
      const component = buildComponent(makeContact());
      const spy = vi.fn();
      component.saved.subscribe(spy);

      component.submit();

      expect(spy).toHaveBeenCalledWith(component.form.getRawValue());
    });
  });
});
