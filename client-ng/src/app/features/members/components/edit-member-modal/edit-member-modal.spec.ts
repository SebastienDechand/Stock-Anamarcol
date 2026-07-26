import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { EditMemberModal } from './edit-member-modal';
import type { User } from '../../../../shared/models/user/user.model';
import { Role } from '../../../../shared/constants/roles/roles.constants';

const sampleUser: User = {
  _id: 'u1',
  username: 'jdupont',
  email: 'jdupont@example.com',
  roles: [Role.USER],
};

describe('EditMemberModal', () => {
  let component: EditMemberModal;
  let fixture: ComponentFixture<EditMemberModal>;

  beforeEach(() => {
    TestBed.overrideComponent(EditMemberModal, { set: { template: '', imports: [] } });
    TestBed.configureTestingModule({
      imports: [EditMemberModal],
    });

    fixture = TestBed.createComponent(EditMemberModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', sampleUser);
    fixture.detectChanges();
  });

  describe('avatarUrl', () => {
    it('returns empty string when the user has no picture', () => {
      expect(component.avatarUrl).toBe('');
    });

    it('returns the picture as-is when it is already an absolute or rooted URL', () => {
      fixture.componentRef.setInput('user', {
        ...sampleUser,
        picture: 'https://cdn.example.com/pic.jpg',
      });
      expect(component.avatarUrl).toBe('https://cdn.example.com/pic.jpg');

      fixture.componentRef.setInput('user', { ...sampleUser, picture: '/uploads/pic.jpg' });
      expect(component.avatarUrl).toBe('/uploads/pic.jpg');
    });

    it('prefixes a bare relative path with a leading slash', () => {
      fixture.componentRef.setInput('user', { ...sampleUser, picture: 'uploads/pic.jpg' });
      expect(component.avatarUrl).toBe('/uploads/pic.jpg');
    });
  });

  describe('initials', () => {
    it('returns the uppercased first letter of the username', () => {
      expect(component.initials).toBe('J');
    });
  });

  describe('onFileChange()', () => {
    it('emits pictureUploaded with the user id and a FormData carrying file/name/userId', () => {
      const file = new File(['data'], 'avatar.png', { type: 'image/png' });
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [file] });

      let emitted: { id: string; formData: FormData } | undefined;
      component.pictureUploaded.subscribe((e) => (emitted = e));

      component.onFileChange({ target: input } as unknown as Event);

      expect(emitted?.id).toBe('u1');
      expect(emitted?.formData.get('file')).toBe(file);
      expect(emitted?.formData.get('name')).toBe('jdupont');
      expect(emitted?.formData.get('userId')).toBe('u1');
    });

    it('does nothing when no file is selected', () => {
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [] });

      let emitted = false;
      component.pictureUploaded.subscribe(() => (emitted = true));

      component.onFileChange({ target: input } as unknown as Event);

      expect(emitted).toBe(false);
    });
  });
});
