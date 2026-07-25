import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { ShipmentsEffects } from './shipments.effects';
import { ShipmentsActions } from '../actions/shipments.actions';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { Shipment, ShipmentForm } from '../../../../shared/models/shipment/shipment.model';

const mockShipment: Shipment = {
  _id: 'abc123',
  lastName: 'Dupont',
  firstName: 'Marie',
  phone: '0601020304',
  phone2: '',
  email: 'marie.dupont@example.com',
  address: '12 rue des Lilas',
  postalCode: '75001',
  city: 'Paris',
  companyOrRole: 'Directrice',
  company: 'Acme SA',
  part: 'passeport',
  sent: false,
  sentBy: undefined,
  createdByName: 'Admin',
  createdAt: '2024-01-15T10:00:00.000Z',
};

const mockShipmentForm: ShipmentForm = {
  lastName: 'Dupont',
  firstName: 'Marie',
  phone: '0601020304',
  phone2: '',
  email: 'marie.dupont@example.com',
  address: '12 rue des Lilas',
  postalCode: '75001',
  city: 'Paris',
  companyOrRole: 'Directrice',
  company: 'Acme SA',
  part: 'passeport',
  requestDate: '2024-01-15',
};

describe('ShipmentsEffects', () => {
  let effects: ShipmentsEffects;
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
        ShipmentsEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    effects = TestBed.inject(ShipmentsEffects);
  });

  // ---------------------------------------------------------------------------
  // fetch$
  // ---------------------------------------------------------------------------
  describe('fetch$', () => {
    it('should dispatch fetchShipmentsSuccess with the shipments list on success', async () => {
      const shipments = [mockShipment];
      api.get.mockReturnValue(of(shipments));

      const fetchPromise = firstValueFrom(effects.fetch$);
      actions$.next(ShipmentsActions.fetchShipments({ params: { page: 1, limit: 10 } }));
      const result = await fetchPromise;

      expect(result).toEqual(ShipmentsActions.fetchShipmentsSuccess({ shipments }));
    });

    it('should handle a null API response by returning an empty list', async () => {
      api.get.mockReturnValue(of(null));

      const fetchPromise = firstValueFrom(effects.fetch$);
      actions$.next(ShipmentsActions.fetchShipments({ params: {} }));
      const result = await fetchPromise;

      expect(result).toEqual(ShipmentsActions.fetchShipmentsSuccess({ shipments: [] }));
    });

    it('should pass the sent param as a string when provided', async () => {
      api.get.mockReturnValue(of([]));

      const fetchPromise = firstValueFrom(effects.fetch$);
      actions$.next(ShipmentsActions.fetchShipments({ params: { sent: false } }));
      await fetchPromise;

      expect(api.get).toHaveBeenCalledWith('api/shipments', { sent: 'false' });
    });

    it('should dispatch fetchShipmentsFailure on API error', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Network error')));

      const fetchPromise = firstValueFrom(effects.fetch$);
      actions$.next(ShipmentsActions.fetchShipments({ params: {} }));
      const result = await fetchPromise;

      expect(result).toEqual(ShipmentsActions.fetchShipmentsFailure({ error: 'Network error' }));
    });

    it('should use fallback error message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => ({})));

      const fetchPromise = firstValueFrom(effects.fetch$);
      actions$.next(ShipmentsActions.fetchShipments({ params: {} }));
      const result = await fetchPromise;

      expect(result).toEqual(ShipmentsActions.fetchShipmentsFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // create$
  // ---------------------------------------------------------------------------
  describe('create$', () => {
    it('should dispatch createShipmentSuccess and show success toast on success', async () => {
      api.post.mockReturnValue(of(mockShipment));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(
        ShipmentsActions.createShipment({ data: mockShipmentForm, createdByName: 'Admin' }),
      );

      const result = await createPromise;

      expect(result).toEqual(ShipmentsActions.createShipmentSuccess({ shipment: mockShipment }));
      expect(toast.success).toHaveBeenCalledWith('TOAST.SHIPMENT_CREATED');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should dispatch createShipmentFailure and show error toast on API error', async () => {
      api.post.mockReturnValue(throwError(() => new Error('Conflict')));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(
        ShipmentsActions.createShipment({ data: mockShipmentForm, createdByName: 'Admin' }),
      );

      const result = await createPromise;

      expect(result).toEqual(ShipmentsActions.createShipmentFailure({ error: 'Conflict' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.SHIPMENT_CREATE_ERROR');
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should use fallback error message when error has no message', async () => {
      api.post.mockReturnValue(throwError(() => ({})));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(
        ShipmentsActions.createShipment({ data: mockShipmentForm, createdByName: 'Admin' }),
      );

      const result = await createPromise;

      expect(result).toEqual(ShipmentsActions.createShipmentFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // markSent$
  // ---------------------------------------------------------------------------
  describe('markSent$', () => {
    const sentShipment: Shipment = { ...mockShipment, sent: true, sentBy: 'Jean' };

    it('should dispatch markSentSuccess and show success toast on success', async () => {
      api.put.mockReturnValue(of(sentShipment));

      const markSentPromise = firstValueFrom(effects.markSent$);
      actions$.next(ShipmentsActions.markSent({ id: 'abc123', sentBy: 'Jean' }));
      const result = await markSentPromise;

      expect(result).toEqual(ShipmentsActions.markSentSuccess({ shipment: sentShipment }));
      expect(api.put).toHaveBeenCalledWith('api/shipments/abc123/sent', { sentBy: 'Jean' });
      expect(toast.success).toHaveBeenCalledWith('TOAST.SHIPMENT_SENT');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should dispatch markSentFailure and show error toast on API error', async () => {
      api.put.mockReturnValue(throwError(() => new Error('Not found')));

      const markSentPromise = firstValueFrom(effects.markSent$);
      actions$.next(ShipmentsActions.markSent({ id: 'abc123', sentBy: 'Jean' }));
      const result = await markSentPromise;

      expect(result).toEqual(ShipmentsActions.markSentFailure({ error: 'Not found' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.SHIPMENT_ERROR');
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should use fallback error message when error has no message', async () => {
      api.put.mockReturnValue(throwError(() => ({})));

      const markSentPromise = firstValueFrom(effects.markSent$);
      actions$.next(ShipmentsActions.markSent({ id: 'abc123', sentBy: 'Jean' }));
      const result = await markSentPromise;

      expect(result).toEqual(ShipmentsActions.markSentFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // delete$
  // ---------------------------------------------------------------------------
  describe('delete$', () => {
    it('should dispatch deleteShipmentSuccess and show success toast on success', async () => {
      api.delete.mockReturnValue(of(undefined));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(ShipmentsActions.deleteShipment({ id: 'abc123' }));
      const result = await deletePromise;

      expect(result).toEqual(ShipmentsActions.deleteShipmentSuccess({ id: 'abc123' }));
      expect(api.delete).toHaveBeenCalledWith('api/shipments/abc123');
      expect(toast.success).toHaveBeenCalledWith('TOAST.SHIPMENT_DELETED');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should dispatch deleteShipmentFailure and show error toast on API error', async () => {
      api.delete.mockReturnValue(throwError(() => new Error('Forbidden')));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(ShipmentsActions.deleteShipment({ id: 'abc123' }));
      const result = await deletePromise;

      expect(result).toEqual(ShipmentsActions.deleteShipmentFailure({ error: 'Forbidden' }));
      expect(toast.error).toHaveBeenCalledWith('TOAST.SHIPMENT_DELETE_ERROR');
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should use fallback error message when error has no message', async () => {
      api.delete.mockReturnValue(throwError(() => ({})));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(ShipmentsActions.deleteShipment({ id: 'abc123' }));
      const result = await deletePromise;

      expect(result).toEqual(ShipmentsActions.deleteShipmentFailure({ error: 'Erreur' }));
    });
  });
});
