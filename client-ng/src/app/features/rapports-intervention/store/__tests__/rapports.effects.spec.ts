import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { RapportsEffects } from '../rapports.effects';
import { RapportsActions } from '../rapports.actions';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { InterventionReport } from '../../../../shared/models/intervention-report.model';

const mockRapport: InterventionReport = {
  _id: 'rapport-1',
  clientFile: 'client-file-1',
  cashguardUnits: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

const mockRapport2: InterventionReport = {
  _id: 'rapport-2',
  clientFile: {
    _id: 'client-file-2',
    nom: 'Dupont',
    prenom: 'Jean',
    societe: 'ACME Corp',
    cp: '75001',
    ville: 'Paris',
  },
  twCaisse1: 'caisse-001',
  twCaisse2: 'caisse-002',
  twPc: 'pc-001',
  cashguardUnits: [
    {
      up: 'UP-1',
      ub: 'UB-1',
      k7Slots: ['slot1', 'slot2', 'slot3', 'slot4'],
      assignedCaisses: ['caisse-001'],
      hasPc: true,
    },
  ],
  notes: 'Some notes',
  createdAt: '2024-01-03T00:00:00.000Z',
  updatedAt: '2024-01-04T00:00:00.000Z',
};

describe('RapportsEffects', () => {
  let effects: RapportsEffects;
  let actions$: Subject<Action>;
  let api: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    api = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    toast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RapportsEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    effects = TestBed.inject(RapportsEffects);
  });

  // ---------------------------------------------------------------------------
  // loadAll$
  // ---------------------------------------------------------------------------
  describe('loadAll$', () => {
    it('should dispatch loadAllSuccess with rapports on success', async () => {
      const rapports = [mockRapport, mockRapport2];
      api.get.mockReturnValue(of(rapports));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(RapportsActions.loadAll());
      const result = await loadAllPromise;

      expect(api.get).toHaveBeenCalledWith('api/intervention-reports');
      expect(result).toEqual(RapportsActions.loadAllSuccess({ rapports }));
    });

    it('should dispatch loadAllFailure with error message on API error', async () => {
      const error = new Error('Server error');
      api.get.mockReturnValue(throwError(() => error));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(RapportsActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(RapportsActions.loadAllFailure({ error: 'Server error' }));
    });

    it('should dispatch loadAllFailure with fallback message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => null));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(RapportsActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(RapportsActions.loadAllFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // loadByClientFile$
  // ---------------------------------------------------------------------------
  describe('loadByClientFile$', () => {
    it('should dispatch loadByClientFileSuccess with rapports on success', async () => {
      const rapports = [mockRapport];
      api.get.mockReturnValue(of(rapports));

      const loadByClientFilePromise = firstValueFrom(effects.loadByClientFile$);
      actions$.next(RapportsActions.loadByClientFile({ clientFileId: 'client-file-1' }));
      const result = await loadByClientFilePromise;

      expect(api.get).toHaveBeenCalledWith('api/intervention-reports', {
        clientFileId: 'client-file-1',
      });
      expect(result).toEqual(RapportsActions.loadByClientFileSuccess({ rapports }));
    });

    it('should dispatch loadByClientFileSuccess with empty array on API error', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Not found')));

      const loadByClientFilePromise = firstValueFrom(effects.loadByClientFile$);
      actions$.next(RapportsActions.loadByClientFile({ clientFileId: 'client-file-99' }));
      const result = await loadByClientFilePromise;

      expect(result).toEqual(RapportsActions.loadByClientFileSuccess({ rapports: [] }));
    });
  });

  // ---------------------------------------------------------------------------
  // loadOne$
  // ---------------------------------------------------------------------------
  describe('loadOne$', () => {
    it('should dispatch loadOneSuccess with rapport on success', async () => {
      api.get.mockReturnValue(of(mockRapport));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(RapportsActions.loadOne({ id: 'rapport-1' }));
      const result = await loadOnePromise;

      expect(api.get).toHaveBeenCalledWith('api/intervention-reports/rapport-1');
      expect(result).toEqual(RapportsActions.loadOneSuccess({ rapport: mockRapport }));
    });

    it('should dispatch loadAllFailure with generic error on API error', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Not found')));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(RapportsActions.loadOne({ id: 'rapport-99' }));
      const result = await loadOnePromise;

      expect(result).toEqual(RapportsActions.loadAllFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // create$
  // ---------------------------------------------------------------------------
  describe('create$', () => {
    const formData = {
      clientFile: 'client-file-1',
      cashguardUnits: [],
    };

    it('should dispatch createRapportSuccess and call toast.success on success', async () => {
      api.post.mockReturnValue(of(mockRapport));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(RapportsActions.createRapport({ data: formData }));
      const result = await createPromise;

      expect(api.post).toHaveBeenCalledWith('api/intervention-reports', formData);
      expect(toast.success).toHaveBeenCalledWith('TOAST.RAPPORT_CREATED');
      expect(result).toEqual(RapportsActions.createRapportSuccess({ rapport: mockRapport }));
    });

    it('should dispatch createRapportFailure and call toast.error on API error', async () => {
      const error = new Error('Create failed');
      api.post.mockReturnValue(throwError(() => error));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(RapportsActions.createRapport({ data: formData }));
      const result = await createPromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.RAPPORT_CREATE_ERROR');
      expect(result).toEqual(RapportsActions.createRapportFailure({ error: 'Create failed' }));
    });

    it('should dispatch createRapportFailure with fallback message when error has no message', async () => {
      api.post.mockReturnValue(throwError(() => null));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(RapportsActions.createRapport({ data: formData }));
      const result = await createPromise;

      expect(result).toEqual(RapportsActions.createRapportFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // update$
  // ---------------------------------------------------------------------------
  describe('update$', () => {
    const updateData = { notes: 'Updated notes' };

    it('should dispatch updateRapportSuccess and call toast.success on success', async () => {
      const updatedRapport: InterventionReport = { ...mockRapport, notes: 'Updated notes' };
      api.put.mockReturnValue(of(updatedRapport));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(RapportsActions.updateRapport({ id: 'rapport-1', data: updateData }));
      const result = await updatePromise;

      expect(api.put).toHaveBeenCalledWith('api/intervention-reports/rapport-1', updateData);
      expect(toast.success).toHaveBeenCalledWith('TOAST.RAPPORT_UPDATED');
      expect(result).toEqual(RapportsActions.updateRapportSuccess({ rapport: updatedRapport }));
    });

    it('should dispatch updateRapportFailure and call toast.error on API error', async () => {
      const error = new Error('Update failed');
      api.put.mockReturnValue(throwError(() => error));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(RapportsActions.updateRapport({ id: 'rapport-1', data: updateData }));
      const result = await updatePromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.RAPPORT_UPDATE_ERROR');
      expect(result).toEqual(RapportsActions.updateRapportFailure({ error: 'Update failed' }));
    });

    it('should dispatch updateRapportFailure with fallback message when error has no message', async () => {
      api.put.mockReturnValue(throwError(() => null));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(RapportsActions.updateRapport({ id: 'rapport-1', data: updateData }));
      const result = await updatePromise;

      expect(result).toEqual(RapportsActions.updateRapportFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // delete$
  // ---------------------------------------------------------------------------
  describe('delete$', () => {
    it('should dispatch deleteRapportSuccess and call toast.success on success', async () => {
      api.delete.mockReturnValue(of(undefined));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(RapportsActions.deleteRapport({ id: 'rapport-1' }));
      const result = await deletePromise;

      expect(api.delete).toHaveBeenCalledWith('api/intervention-reports/rapport-1');
      expect(toast.success).toHaveBeenCalledWith('TOAST.RAPPORT_DELETED');
      expect(result).toEqual(RapportsActions.deleteRapportSuccess({ id: 'rapport-1' }));
    });

    it('should dispatch deleteRapportFailure and call toast.error on API error', async () => {
      const error = new Error('Delete failed');
      api.delete.mockReturnValue(throwError(() => error));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(RapportsActions.deleteRapport({ id: 'rapport-1' }));
      const result = await deletePromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.RAPPORT_DELETE_ERROR');
      expect(result).toEqual(RapportsActions.deleteRapportFailure({ error: 'Delete failed' }));
    });

    it('should dispatch deleteRapportFailure with fallback message when error has no message', async () => {
      api.delete.mockReturnValue(throwError(() => null));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(RapportsActions.deleteRapport({ id: 'rapport-1' }));
      const result = await deletePromise;

      expect(result).toEqual(RapportsActions.deleteRapportFailure({ error: 'Erreur' }));
    });
  });
});
