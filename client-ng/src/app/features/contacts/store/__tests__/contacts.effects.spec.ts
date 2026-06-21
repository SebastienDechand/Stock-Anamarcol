import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { ContactsEffects } from '../contacts.effects';
import { ContactsActions } from '../contacts.actions';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { Contact } from '../../../../shared/models/contact.model';

const mockContact: Contact = {
  _id: 'abc123',
  nom: 'Dupont',
  email: 'dupont@example.com',
  poste: 'Développeur',
  tel: '0600000000',
  picture: 'https://example.com/photo.jpg',
  lien: 'https://linkedin.com/in/dupont',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
};

const mockContacts: Contact[] = [
  mockContact,
  {
    _id: 'def456',
    nom: 'Martin',
    email: 'martin@example.com',
    poste: 'Designer',
  },
];

describe('ContactsEffects', () => {
  let effects: ContactsEffects;
  let actions$: Subject<Action>;
  let api: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    actions$ = new Subject<Action>();

    api = {
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
    };

    toast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ContactsEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    effects = TestBed.inject(ContactsEffects);
  });

  // ─── loadAll$ ────────────────────────────────────────────────────────────

  describe('loadAll$', () => {
    it('should dispatch loadAllSuccess on success', async () => {
      api.get.mockReturnValue(of(mockContacts));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(ContactsActions.loadAll());
      const result = await loadAllPromise;

      expect(api.get).toHaveBeenCalledWith('api/contacts/');
      expect(result).toEqual(ContactsActions.loadAllSuccess({ contacts: mockContacts }));
    });

    it('should dispatch loadAllFailure with error message on failure', async () => {
      const error = new Error('Network error');
      api.get.mockReturnValue(throwError(() => error));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(ContactsActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(ContactsActions.loadAllFailure({ error: 'Network error' }));
    });

    it('should dispatch loadAllFailure with fallback message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => ({})));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(ContactsActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(ContactsActions.loadAllFailure({ error: 'Erreur' }));
    });
  });

  // ─── loadOne$ ────────────────────────────────────────────────────────────

  describe('loadOne$', () => {
    it('should dispatch loadOneSuccess on success', async () => {
      api.get.mockReturnValue(of(mockContact));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(ContactsActions.loadOne({ id: 'abc123' }));
      const result = await loadOnePromise;

      expect(api.get).toHaveBeenCalledWith('api/contacts/abc123');
      expect(result).toEqual(ContactsActions.loadOneSuccess({ contact: mockContact }));
    });

    it('should dispatch loadOneFailure with error message on failure', async () => {
      const error = new Error('Not found');
      api.get.mockReturnValue(throwError(() => error));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(ContactsActions.loadOne({ id: 'abc123' }));
      const result = await loadOnePromise;

      expect(result).toEqual(ContactsActions.loadOneFailure({ error: 'Not found' }));
    });

    it('should dispatch loadOneFailure with fallback message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => null));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(ContactsActions.loadOne({ id: 'abc123' }));
      const result = await loadOnePromise;

      expect(result).toEqual(ContactsActions.loadOneFailure({ error: 'Erreur' }));
    });
  });

  // ─── update$ ─────────────────────────────────────────────────────────────

  describe('update$', () => {
    const updateData: Partial<Contact> = { nom: 'Dupont Updated', poste: 'Lead Dev' };

    it('should dispatch updateContactSuccess and call toast.success on success', async () => {
      api.put.mockReturnValue(of(mockContact));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(ContactsActions.updateContact({ id: 'abc123', data: updateData }));
      const result = await updatePromise;

      expect(api.put).toHaveBeenCalledWith('api/contacts/abc123', updateData);
      expect(toast.success).toHaveBeenCalledWith('TOAST.CONTACT_UPDATED');
      expect(result).toEqual(ContactsActions.updateContactSuccess({ contact: mockContact }));
    });

    it('should dispatch updateContactFailure and call toast.error on failure', async () => {
      const error = new Error('Update failed');
      api.put.mockReturnValue(throwError(() => error));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(ContactsActions.updateContact({ id: 'abc123', data: updateData }));
      const result = await updatePromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.CONTACT_UPDATE_ERROR');
      expect(result).toEqual(ContactsActions.updateContactFailure({ error: 'Update failed' }));
    });

    it('should dispatch updateContactFailure with fallback message when error has no message', async () => {
      api.put.mockReturnValue(throwError(() => undefined));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(ContactsActions.updateContact({ id: 'abc123', data: updateData }));
      const result = await updatePromise;

      expect(result).toEqual(ContactsActions.updateContactFailure({ error: 'Erreur' }));
    });
  });

  // ─── uploadPicture$ ───────────────────────────────────────────────────────

  describe('uploadPicture$', () => {
    let formData: FormData;

    beforeEach(() => {
      formData = new FormData();
      formData.append('file', new Blob(['image data'], { type: 'image/jpeg' }), 'photo.jpg');
    });

    it('should dispatch uploadPictureSuccess and call toast.success on success', async () => {
      api.post.mockReturnValue(of(undefined));
      api.get.mockReturnValue(of(mockContact));

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(ContactsActions.uploadPicture({ id: 'abc123', formData }));
      const result = await uploadPicturePromise;

      expect(api.post).toHaveBeenCalledWith('api/contacts/upload', formData);
      expect(api.get).toHaveBeenCalledWith('api/contacts/abc123');
      expect(toast.success).toHaveBeenCalledWith('TOAST.CONTACT_PHOTO_UPDATED');
      expect(result).toEqual(ContactsActions.uploadPictureSuccess({ contact: mockContact }));
    });

    it('should dispatch uploadPictureFailure and call toast.error when post fails', async () => {
      const error = new Error('Upload failed');
      api.post.mockReturnValue(throwError(() => error));

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(ContactsActions.uploadPicture({ id: 'abc123', formData }));
      const result = await uploadPicturePromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.CONTACT_PHOTO_ERROR');
      expect(result).toEqual(ContactsActions.uploadPictureFailure({ error: 'Upload failed' }));
    });

    it('should dispatch uploadPictureFailure and call toast.error when get after post fails', async () => {
      const error = new Error('Fetch after upload failed');
      api.post.mockReturnValue(of(undefined));
      api.get.mockReturnValue(throwError(() => error));

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(ContactsActions.uploadPicture({ id: 'abc123', formData }));
      const result = await uploadPicturePromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.CONTACT_PHOTO_ERROR');
      expect(result).toEqual(
        ContactsActions.uploadPictureFailure({ error: 'Fetch after upload failed' }),
      );
    });

    it('should dispatch uploadPictureFailure with fallback message when error has no message', async () => {
      api.post.mockReturnValue(throwError(() => null));

      const uploadPicturePromise = firstValueFrom(effects.uploadPicture$);
      actions$.next(ContactsActions.uploadPicture({ id: 'abc123', formData }));
      const result = await uploadPicturePromise;

      expect(result).toEqual(ContactsActions.uploadPictureFailure({ error: 'Erreur' }));
    });
  });
});
