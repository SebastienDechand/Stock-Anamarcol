import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ContactCard } from './contact-card';
import type { Contact } from '../../../../shared/models/contact/contact.model';

const makeContact = (overrides: Partial<Contact> = {}): Contact => ({
  _id: '1',
  name: 'Alice',
  ...overrides,
});

describe('ContactCard', () => {
  let component: ContactCard;

  beforeEach(async () => {
    TestBed.overrideComponent(ContactCard, { set: { template: '', imports: [] } });
    await TestBed.configureTestingModule({ imports: [ContactCard] }).compileComponents();

    const fixture = TestBed.createComponent(ContactCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('contact', makeContact());
    fixture.detectChanges();
  });

  describe('initials', () => {
    it('returns the uppercased first letter of the name', () => {
      expect(component.initials).toBe('A');
    });

    it('returns "?" when the name is empty', () => {
      const fixture = TestBed.createComponent(ContactCard);
      fixture.componentRef.setInput('contact', makeContact({ name: '' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.initials).toBe('?');
    });
  });

  describe('avatarUrl', () => {
    it('returns an empty string when there is no picture', () => {
      expect(component.avatarUrl).toBe('');
    });

    it('returns the picture as-is when it is an absolute URL', () => {
      const fixture = TestBed.createComponent(ContactCard);
      fixture.componentRef.setInput(
        'contact',
        makeContact({ picture: 'https://example.com/avatar.jpg' }),
      );
      fixture.detectChanges();
      expect(fixture.componentInstance.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('returns the picture as-is when it is already rooted', () => {
      const fixture = TestBed.createComponent(ContactCard);
      fixture.componentRef.setInput('contact', makeContact({ picture: '/static/avatar.jpg' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.avatarUrl).toBe('/static/avatar.jpg');
    });

    it('prepends a leading slash to a bare relative path', () => {
      const fixture = TestBed.createComponent(ContactCard);
      fixture.componentRef.setInput('contact', makeContact({ picture: 'avatar.jpg' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.avatarUrl).toBe('/avatar.jpg');
    });
  });
});
