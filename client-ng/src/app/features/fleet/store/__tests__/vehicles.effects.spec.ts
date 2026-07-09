import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError, Subject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';
import { VehiclesEffects } from '../vehicles.effects';
import { VehiclesActions } from '../vehicles.actions';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { Vehicle, VehicleForm } from '../../../../shared/models/vehicle.model';

const mockVehicle: Vehicle = {
  _id: 'v-001',
  marque: 'mercedes',
  modele: 'vito',
  format: 'utilitaire',
  immatriculation: 'AB-123-CD',
  documents: [],
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-06-01T08:00:00.000Z',
};

const mockVehicle2: Vehicle = {
  _id: 'v-002',
  marque: 'nissan',
  modele: 'navara',
  format: 'pickup',
  immatriculation: 'EF-456-GH',
  documents: [],
};

const mockVehicleForm: VehicleForm = {
  marque: 'mercedes',
  modele: 'citan',
  format: 'utilitaire',
  immatriculation: 'XY-789-ZA',
  notes: '',
};

describe('VehiclesEffects', () => {
  let effects: VehiclesEffects;
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
        VehiclesEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    effects = TestBed.inject(VehiclesEffects);
  });

  // ─── loadAll$ ───────────────────────────────────────────────────────────────

  describe('loadAll$', () => {
    it('should dispatch loadAllSuccess on success', async () => {
      const vehicles = [mockVehicle, mockVehicle2];
      api.get.mockReturnValue(of(vehicles));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(VehiclesActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(VehiclesActions.loadAllSuccess({ vehicles }));
      expect(api.get).toHaveBeenCalledWith('api/vehicles');
    });

    it('should dispatch loadAllFailure with error message on failure', async () => {
      api.get.mockReturnValue(throwError(() => ({ message: 'Network error' })));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(VehiclesActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(VehiclesActions.loadAllFailure({ error: 'Network error' }));
    });

    it('should dispatch loadAllFailure with default message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => ({})));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(VehiclesActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(VehiclesActions.loadAllFailure({ error: 'Erreur' }));
    });
  });

  // ─── loadOne$ ───────────────────────────────────────────────────────────────

  describe('loadOne$', () => {
    it('should dispatch loadOneSuccess on success', async () => {
      api.get.mockReturnValue(of(mockVehicle));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(VehiclesActions.loadOne({ id: 'v-001' }));
      const result = await loadOnePromise;

      expect(result).toEqual(VehiclesActions.loadOneSuccess({ vehicle: mockVehicle }));
      expect(api.get).toHaveBeenCalledWith('api/vehicles/v-001');
    });

    it('should dispatch loadAllFailure with default message on failure', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Not found')));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(VehiclesActions.loadOne({ id: 'v-999' }));
      const result = await loadOnePromise;

      expect(result).toEqual(VehiclesActions.loadAllFailure({ error: 'Erreur chargement' }));
    });
  });

  // ─── search$ ────────────────────────────────────────────────────────────────

  describe('search$', () => {
    it('should dispatch searchSuccess with results on success', async () => {
      const vehicles = [mockVehicle];
      api.get.mockReturnValue(of(vehicles));

      const searchPromise = firstValueFrom(effects.search$);
      actions$.next(VehiclesActions.search({ q: 'vito' }));
      const result = await searchPromise;

      expect(result).toEqual(VehiclesActions.searchSuccess({ vehicles }));
      expect(api.get).toHaveBeenCalledWith('api/vehicles/search', { q: 'vito' });
    });

    it('should dispatch searchSuccess with empty array on failure', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Search failed')));

      const searchPromise = firstValueFrom(effects.search$);
      actions$.next(VehiclesActions.search({ q: 'unknown' }));
      const result = await searchPromise;

      expect(result).toEqual(VehiclesActions.searchSuccess({ vehicles: [] }));
    });
  });

  // ─── create$ ────────────────────────────────────────────────────────────────

  describe('create$', () => {
    it('should dispatch createVehicleSuccess and call toast.success on success', async () => {
      api.post.mockReturnValue(of(mockVehicle));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(VehiclesActions.createVehicle({ data: mockVehicleForm }));
      const result = await createPromise;

      expect(result).toEqual(VehiclesActions.createVehicleSuccess({ vehicle: mockVehicle }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.VEHICLE_ADDED');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should dispatch createVehicleFailure and call toast.error on failure', async () => {
      api.post.mockReturnValue(throwError(() => ({ message: 'Validation error' })));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(VehiclesActions.createVehicle({ data: mockVehicleForm }));
      const result = await createPromise;

      expect(result).toEqual(VehiclesActions.createVehicleFailure({ error: 'Validation error' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.VEHICLE_ADD_ERROR');
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should dispatch createVehicleFailure with default message when error has no message', async () => {
      api.post.mockReturnValue(throwError(() => ({})));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(VehiclesActions.createVehicle({ data: mockVehicleForm }));
      const result = await createPromise;

      expect(result).toEqual(VehiclesActions.createVehicleFailure({ error: 'Erreur' }));
    });

    it('should clean empty string fields to null before posting', async () => {
      const formWithEmpty: VehicleForm = { ...mockVehicleForm, notes: '' };
      api.post.mockReturnValue(of(mockVehicle));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(VehiclesActions.createVehicle({ data: formWithEmpty }));
      await createPromise;

      const postedBody = api.post.mock.calls[0][1] as Record<string, unknown>;
      expect(postedBody['notes']).toBeNull();
    });
  });

  // ─── update$ ────────────────────────────────────────────────────────────────

  describe('update$', () => {
    it('should dispatch updateVehicleSuccess and call toast.success on success', async () => {
      const updatedVehicle: Vehicle = { ...mockVehicle, immatriculation: 'ZZ-000-ZZ' };
      api.put.mockReturnValue(of(updatedVehicle));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(
        VehiclesActions.updateVehicle({ id: 'v-001', data: { immatriculation: 'ZZ-000-ZZ' } }),
      );
      const result = await updatePromise;

      expect(result).toEqual(VehiclesActions.updateVehicleSuccess({ vehicle: updatedVehicle }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.VEHICLE_UPDATED');
      expect(api.put).toHaveBeenCalledWith('api/vehicles/v-001', expect.any(Object));
    });

    it('should dispatch updateVehicleFailure and call toast.error on failure', async () => {
      api.put.mockReturnValue(throwError(() => ({ message: 'Update failed' })));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(
        VehiclesActions.updateVehicle({ id: 'v-001', data: { immatriculation: 'ZZ-000-ZZ' } }),
      );
      const result = await updatePromise;

      expect(result).toEqual(VehiclesActions.updateVehicleFailure({ error: 'Update failed' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.VEHICLE_UPDATE_ERROR');
    });

    it('should dispatch updateVehicleFailure with default message when error has no message', async () => {
      api.put.mockReturnValue(throwError(() => ({})));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(VehiclesActions.updateVehicle({ id: 'v-001', data: {} }));
      const result = await updatePromise;

      expect(result).toEqual(VehiclesActions.updateVehicleFailure({ error: 'Erreur' }));
    });
  });

  // ─── delete$ ────────────────────────────────────────────────────────────────

  describe('delete$', () => {
    it('should dispatch deleteVehicleSuccess and call toast.success on success', async () => {
      api.delete.mockReturnValue(of(void 0));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(VehiclesActions.deleteVehicle({ id: 'v-001' }));
      const result = await deletePromise;

      expect(result).toEqual(VehiclesActions.deleteVehicleSuccess({ id: 'v-001' }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.VEHICLE_DELETED');
      expect(api.delete).toHaveBeenCalledWith('api/vehicles/v-001');
    });

    it('should dispatch deleteVehicleFailure and call toast.error on failure', async () => {
      api.delete.mockReturnValue(throwError(() => ({ message: 'Delete failed' })));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(VehiclesActions.deleteVehicle({ id: 'v-001' }));
      const result = await deletePromise;

      expect(result).toEqual(VehiclesActions.deleteVehicleFailure({ error: 'Delete failed' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.VEHICLE_DELETE_ERROR');
    });

    it('should dispatch deleteVehicleFailure with default message when error has no message', async () => {
      api.delete.mockReturnValue(throwError(() => ({})));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(VehiclesActions.deleteVehicle({ id: 'v-001' }));
      const result = await deletePromise;

      expect(result).toEqual(VehiclesActions.deleteVehicleFailure({ error: 'Erreur' }));
    });
  });

  // ─── uploadDoc$ ─────────────────────────────────────────────────────────────

  describe('uploadDoc$', () => {
    it('should dispatch uploadDocumentSuccess and call toast.success on success', async () => {
      const vehicleWithDoc: Vehicle = {
        ...mockVehicle,
        documents: [
          {
            _id: 'doc-1',
            name: 'CT 2024',
            filename: 'ct-2024.pdf',
            type: 'ct',
            uploadedAt: '2024-05-01',
          },
        ],
      };
      const formData = new FormData();
      formData.append('file', new Blob(['pdf content']), 'ct-2024.pdf');
      api.postFormData.mockReturnValue(of(vehicleWithDoc));

      const uploadDocPromise = firstValueFrom(effects.uploadDoc$);
      actions$.next(VehiclesActions.uploadDocument({ id: 'v-001', formData }));
      const result = await uploadDocPromise;

      expect(result).toEqual(VehiclesActions.uploadDocumentSuccess({ vehicle: vehicleWithDoc }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.DOC_ADDED');
      expect(api.postFormData).toHaveBeenCalledWith('api/vehicles/v-001/documents', formData);
    });

    it('should dispatch uploadDocumentFailure and call toast.error on failure', async () => {
      const formData = new FormData();
      api.postFormData.mockReturnValue(throwError(() => ({ message: 'Upload failed' })));

      const uploadDocPromise = firstValueFrom(effects.uploadDoc$);
      actions$.next(VehiclesActions.uploadDocument({ id: 'v-001', formData }));
      const result = await uploadDocPromise;

      expect(result).toEqual(VehiclesActions.uploadDocumentFailure({ error: 'Upload failed' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.VEHICLE_DOC_ADD_ERROR');
    });

    it('should dispatch uploadDocumentFailure with default message when error has no message', async () => {
      const formData = new FormData();
      api.postFormData.mockReturnValue(throwError(() => ({})));

      const uploadDocPromise = firstValueFrom(effects.uploadDoc$);
      actions$.next(VehiclesActions.uploadDocument({ id: 'v-001', formData }));
      const result = await uploadDocPromise;

      expect(result).toEqual(VehiclesActions.uploadDocumentFailure({ error: 'Erreur' }));
    });
  });

  // ─── deleteDoc$ ─────────────────────────────────────────────────────────────

  describe('deleteDoc$', () => {
    it('should dispatch deleteDocumentSuccess and call toast.success on success', async () => {
      const vehicleWithoutDoc: Vehicle = { ...mockVehicle, documents: [] };
      api.delete.mockReturnValue(of(vehicleWithoutDoc));

      const deleteDocPromise = firstValueFrom(effects.deleteDoc$);
      actions$.next(VehiclesActions.deleteDocument({ vehicleId: 'v-001', docId: 'doc-1' }));
      const result = await deleteDocPromise;

      expect(result).toEqual(VehiclesActions.deleteDocumentSuccess({ vehicle: vehicleWithoutDoc }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.DOC_DELETED');
      expect(api.delete).toHaveBeenCalledWith('api/vehicles/v-001/documents/doc-1');
    });

    it('should dispatch deleteDocumentFailure and call toast.error on failure', async () => {
      api.delete.mockReturnValue(throwError(() => ({ message: 'Doc delete failed' })));

      const deleteDocPromise = firstValueFrom(effects.deleteDoc$);
      actions$.next(VehiclesActions.deleteDocument({ vehicleId: 'v-001', docId: 'doc-1' }));
      const result = await deleteDocPromise;

      expect(result).toEqual(VehiclesActions.deleteDocumentFailure({ error: 'Doc delete failed' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.VEHICLE_DOC_DELETE_ERROR');
    });

    it('should dispatch deleteDocumentFailure with default message when error has no message', async () => {
      api.delete.mockReturnValue(throwError(() => ({})));

      const deleteDocPromise = firstValueFrom(effects.deleteDoc$);
      actions$.next(VehiclesActions.deleteDocument({ vehicleId: 'v-001', docId: 'doc-1' }));
      const result = await deleteDocPromise;

      expect(result).toEqual(VehiclesActions.deleteDocumentFailure({ error: 'Erreur' }));
    });
  });
});
