import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { EditMembreModal } from '../edit-membre-modal';
import type { User } from '../../../../../shared/models/user.model';
import { Role } from '../../../../../shared/constants/roles.constants';

const sampleUser: User = {
  _id: 'u1',
  pseudo: 'jdupont',
  email: 'jdupont@example.com',
  roles: [Role.USER],
};

describe('EditMembreModal', () => {
  let component: EditMembreModal;

  beforeEach(() => {
    TestBed.overrideComponent(EditMembreModal, { set: { template: '', imports: [] } });
    TestBed.configureTestingModule({
      imports: [EditMembreModal],
    });

    const fixture = TestBed.createComponent(EditMembreModal);
    component = fixture.componentInstance;
    component.user = sampleUser;
    fixture.detectChanges();
  });

  describe('avatarUrl', () => {
    it('returns empty string when the user has no picture', () => {
      expect(component.avatarUrl).toBe('');
    });

    it('returns the picture as-is when it is already an absolute or rooted URL', () => {
      component.user = { ...sampleUser, picture: 'https://cdn.example.com/pic.jpg' };
      expect(component.avatarUrl).toBe('https://cdn.example.com/pic.jpg');

      component.user = { ...sampleUser, picture: '/uploads/pic.jpg' };
      expect(component.avatarUrl).toBe('/uploads/pic.jpg');
    });

    it('prefixes a bare relative path with a leading slash', () => {
      component.user = { ...sampleUser, picture: 'uploads/pic.jpg' };
      expect(component.avatarUrl).toBe('/uploads/pic.jpg');
    });
  });

  describe('initials', () => {
    it('returns the uppercased first letter of the pseudo', () => {
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
