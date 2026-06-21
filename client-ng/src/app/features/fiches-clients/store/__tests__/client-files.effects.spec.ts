import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { ClientFile } from '../../../../shared/models/client-file.model';
import { ClientFilesEffects } from '../client-files.effects';
import { ClientFilesActions } from '../client-files.actions';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockEquipement = {
  nbCashguard: 1,
  nbFusion: 0,
  nbCaisses: 3,
  nbAutresMateriels: 0,
  nbBalancesCaisses: 2,
  licencesTactis: 3,
  licencesInno: 0,
  pcBackoffice: 1,
  pcCentralisation: 1,
  borneAllergene: false,
  borneCommande: true,
  etiquettesElectronique: false,
  carteFidelite: true,
};

const mockFile: ClientFile = {
  _id: 'file-001',
  nom: 'Dupont',
  prenom: 'Marie',
  email: 'marie.dupont@example.com',
  tel: '0102030405',
  ville: 'Paris',
  cp: '75001',
  visitePreinstallation: true,
  saisirFichierProduit: false,
  decoupePlanMenuiserie: false,
  decoupePlanMarbrerie: false,
  equipement: mockEquipement,
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-06-01T12:00:00.000Z',
};

const mockFile2: ClientFile = {
  _id: 'file-002',
  nom: 'Martin',
  prenom: 'Paul',
  email: 'paul.martin@example.com',
  visitePreinstallation: false,
  saisirFichierProduit: true,
  decoupePlanMenuiserie: true,
  decoupePlanMarbrerie: false,
  equipement: { ...mockEquipement, nbCaisses: 5 },
  createdAt: '2024-02-20T08:00:00.000Z',
  updatedAt: '2024-06-15T09:30:00.000Z',
};

const mockFormData: Partial<typeof mockFile> = {
  nom: 'Durand',
  prenom: 'Sophie',
  email: 'sophie.durand@example.com',
  visitePreinstallation: false,
  saisirFichierProduit: false,
  decoupePlanMenuiserie: false,
  decoupePlanMarbrerie: false,
  equipement: mockEquipement,
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ClientFilesEffects', () => {
  let effects: ClientFilesEffects;
  let actions$: Subject<Action>;
  let api: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    postFormData: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    api = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      postFormData: vi.fn(),
    };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ClientFilesEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    effects = TestBed.inject(ClientFilesEffects);
  });

  // ── loadAll$ ──────────────────────────────────────────────────────────────

  describe('loadAll$', () => {
    it('should dispatch loadAllSuccess with files on success', async () => {
      const files = [mockFile, mockFile2];
      api.get.mockReturnValue(of(files));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(ClientFilesActions.loadAll());
      const result = await loadAllPromise;

      expect(api.get).toHaveBeenCalledWith('api/client-files');
      expect(result).toEqual(ClientFilesActions.loadAllSuccess({ files }));
    });

    it('should dispatch loadAllFailure with error message on failure', async () => {
      const error = new Error('Network error');
      api.get.mockReturnValue(throwError(() => error));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(ClientFilesActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(ClientFilesActions.loadAllFailure({ error: 'Network error' }));
    });

    it('should dispatch loadAllFailure with fallback message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => null));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(ClientFilesActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(ClientFilesActions.loadAllFailure({ error: 'Erreur' }));
    });
  });

  // ── loadOne$ ──────────────────────────────────────────────────────────────

  describe('loadOne$', () => {
    it('should dispatch loadOneSuccess with the file on success', async () => {
      api.get.mockReturnValue(of(mockFile));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(ClientFilesActions.loadOne({ id: 'file-001' }));
      const result = await loadOnePromise;

      expect(api.get).toHaveBeenCalledWith('api/client-files/file-001');
      expect(result).toEqual(ClientFilesActions.loadOneSuccess({ file: mockFile }));
    });

    it('should dispatch loadOneFailure with error message on failure', async () => {
      const error = new Error('Not found');
      api.get.mockReturnValue(throwError(() => error));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(ClientFilesActions.loadOne({ id: 'file-001' }));
      const result = await loadOnePromise;

      expect(result).toEqual(ClientFilesActions.loadOneFailure({ error: 'Not found' }));
    });

    it('should dispatch loadOneFailure with fallback message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => ({})));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(ClientFilesActions.loadOne({ id: 'file-001' }));
      const result = await loadOnePromise;

      expect(result).toEqual(ClientFilesActions.loadOneFailure({ error: 'Erreur' }));
    });
  });

  // ── create$ ───────────────────────────────────────────────────────────────

  describe('create$', () => {
    it('should dispatch createFileSuccess and show success toast on success', async () => {
      api.post.mockReturnValue(of(mockFile));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(ClientFilesActions.createFile({ data: mockFormData }));
      const result = await createPromise;

      expect(api.post).toHaveBeenCalledWith('api/client-files', mockFormData);
      expect(toast.success).toHaveBeenCalledWith('TOAST.CLIENT_FILE_CREATED');
      expect(result).toEqual(ClientFilesActions.createFileSuccess({ file: mockFile }));
    });

    it('should dispatch createFileFailure and show error toast on failure', async () => {
      const error = new Error('Validation failed');
      api.post.mockReturnValue(throwError(() => error));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(ClientFilesActions.createFile({ data: mockFormData }));
      const result = await createPromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.CLIENT_FILE_CREATE_ERROR');
      expect(result).toEqual(ClientFilesActions.createFileFailure({ error: 'Validation failed' }));
    });

    it('should dispatch createFileFailure with fallback message when error has no message', async () => {
      api.post.mockReturnValue(throwError(() => null));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(ClientFilesActions.createFile({ data: mockFormData }));
      const result = await createPromise;

      expect(result).toEqual(ClientFilesActions.createFileFailure({ error: 'Erreur' }));
    });
  });

  // ── update$ ───────────────────────────────────────────────────────────────

  describe('update$', () => {
    const updatedData = { nom: 'Dupont-Durand', prenom: 'Marie' };

    it('should dispatch updateFileSuccess and show success toast on success', async () => {
      const updatedFile = { ...mockFile, ...updatedData };
      api.put.mockReturnValue(of(updatedFile));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(ClientFilesActions.updateFile({ id: 'file-001', data: updatedData }));
      const result = await updatePromise;

      expect(api.put).toHaveBeenCalledWith('api/client-files/file-001', updatedData);
      expect(toast.success).toHaveBeenCalledWith('TOAST.CLIENT_FILE_UPDATED');
      expect(result).toEqual(ClientFilesActions.updateFileSuccess({ file: updatedFile }));
    });

    it('should dispatch updateFileFailure and show error toast on failure', async () => {
      const error = new Error('Server error');
      api.put.mockReturnValue(throwError(() => error));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(ClientFilesActions.updateFile({ id: 'file-001', data: updatedData }));
      const result = await updatePromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.CLIENT_FILE_UPDATE_ERROR');
      expect(result).toEqual(ClientFilesActions.updateFileFailure({ error: 'Server error' }));
    });

    it('should dispatch updateFileFailure with fallback message when error has no message', async () => {
      api.put.mockReturnValue(throwError(() => undefined));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(ClientFilesActions.updateFile({ id: 'file-001', data: updatedData }));
      const result = await updatePromise;

      expect(result).toEqual(ClientFilesActions.updateFileFailure({ error: 'Erreur' }));
    });
  });

  // ── delete$ ───────────────────────────────────────────────────────────────

  describe('delete$', () => {
    it('should dispatch deleteFileSuccess and show success toast on success', async () => {
      api.delete.mockReturnValue(of(undefined));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(ClientFilesActions.deleteFile({ id: 'file-001' }));
      const result = await deletePromise;

      expect(api.delete).toHaveBeenCalledWith('api/client-files/file-001');
      expect(toast.success).toHaveBeenCalledWith('TOAST.CLIENT_FILE_DELETED');
      expect(result).toEqual(ClientFilesActions.deleteFileSuccess({ id: 'file-001' }));
    });

    it('should dispatch deleteFileFailure and show error toast on failure', async () => {
      const error = new Error('Forbidden');
      api.delete.mockReturnValue(throwError(() => error));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(ClientFilesActions.deleteFile({ id: 'file-001' }));
      const result = await deletePromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.CLIENT_FILE_DELETE_ERROR');
      expect(result).toEqual(ClientFilesActions.deleteFileFailure({ error: 'Forbidden' }));
    });

    it('should dispatch deleteFileFailure with fallback message when error has no message', async () => {
      api.delete.mockReturnValue(throwError(() => ({})));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(ClientFilesActions.deleteFile({ id: 'file-001' }));
      const result = await deletePromise;

      expect(result).toEqual(ClientFilesActions.deleteFileFailure({ error: 'Erreur' }));
    });
  });

  // ── uploadDoc$ ────────────────────────────────────────────────────────────

  describe('uploadDoc$', () => {
    it('should dispatch uploadDocumentSuccess and show success toast on success', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['content'], { type: 'application/pdf' }), 'rapport.pdf');
      const fileWithDoc: ClientFile = {
        ...mockFile,
        documents: [
          {
            _id: 'doc-001',
            name: 'rapport.pdf',
            filename: 'rapport_2024.pdf',
            type: 'rapport',
            uploadedAt: '2024-06-01T12:00:00.000Z',
          },
        ],
      };
      api.postFormData.mockReturnValue(of(fileWithDoc));

      const uploadDocPromise = firstValueFrom(effects.uploadDoc$);
      actions$.next(ClientFilesActions.uploadDocument({ id: 'file-001', formData }));
      const result = await uploadDocPromise;

      expect(api.postFormData).toHaveBeenCalledWith(
        'api/client-files/file-001/documents',
        formData,
      );
      expect(toast.success).toHaveBeenCalledWith('TOAST.DOC_ADDED');
      expect(result).toEqual(ClientFilesActions.uploadDocumentSuccess({ file: fileWithDoc }));
    });

    it('should dispatch uploadDocumentFailure and show error toast on failure', async () => {
      const formData = new FormData();
      const error = new Error('File too large');
      api.postFormData.mockReturnValue(throwError(() => error));

      const uploadDocPromise = firstValueFrom(effects.uploadDoc$);
      actions$.next(ClientFilesActions.uploadDocument({ id: 'file-001', formData }));
      const result = await uploadDocPromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.DOC_UPLOAD_ERROR');
      expect(result).toEqual(ClientFilesActions.uploadDocumentFailure({ error: 'File too large' }));
    });

    it('should dispatch uploadDocumentFailure with fallback message when error has no message', async () => {
      const formData = new FormData();
      api.postFormData.mockReturnValue(throwError(() => null));

      const uploadDocPromise = firstValueFrom(effects.uploadDoc$);
      actions$.next(ClientFilesActions.uploadDocument({ id: 'file-001', formData }));
      const result = await uploadDocPromise;

      expect(result).toEqual(ClientFilesActions.uploadDocumentFailure({ error: 'Erreur' }));
    });
  });

  // ── deleteDoc$ ────────────────────────────────────────────────────────────

  describe('deleteDoc$', () => {
    it('should dispatch deleteDocumentSuccess and show success toast on success', async () => {
      const fileWithoutDoc: ClientFile = { ...mockFile, documents: [] };
      api.delete.mockReturnValue(of(fileWithoutDoc));

      const deleteDocPromise = firstValueFrom(effects.deleteDoc$);
      actions$.next(ClientFilesActions.deleteDocument({ fileId: 'file-001', docId: 'doc-001' }));
      const result = await deleteDocPromise;

      expect(api.delete).toHaveBeenCalledWith('api/client-files/file-001/documents/doc-001');
      expect(toast.success).toHaveBeenCalledWith('TOAST.DOC_DELETED');
      expect(result).toEqual(ClientFilesActions.deleteDocumentSuccess({ file: fileWithoutDoc }));
    });

    it('should dispatch deleteDocumentFailure and show error toast on failure', async () => {
      const error = new Error('Document not found');
      api.delete.mockReturnValue(throwError(() => error));

      const deleteDocPromise = firstValueFrom(effects.deleteDoc$);
      actions$.next(ClientFilesActions.deleteDocument({ fileId: 'file-001', docId: 'doc-001' }));
      const result = await deleteDocPromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.DOC_DELETE_ERROR');
      expect(result).toEqual(
        ClientFilesActions.deleteDocumentFailure({ error: 'Document not found' }),
      );
    });

    it('should dispatch deleteDocumentFailure with fallback message when error has no message', async () => {
      api.delete.mockReturnValue(throwError(() => undefined));

      const deleteDocPromise = firstValueFrom(effects.deleteDoc$);
      actions$.next(ClientFilesActions.deleteDocument({ fileId: 'file-001', docId: 'doc-001' }));
      const result = await deleteDocPromise;

      expect(result).toEqual(ClientFilesActions.deleteDocumentFailure({ error: 'Erreur' }));
    });
  });
});
