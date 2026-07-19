import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { InterventionReportsEffects } from '../intervention-reports.effects';
import { InterventionReportsActions } from '../intervention-reports.actions';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { InterventionReport } from '../../../../shared/models/intervention-report.model';

const mockReport: InterventionReport = {
  _id: 'report-1',
  clientFile: 'client-file-1',
  cashguardUnits: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

const mockReport2: InterventionReport = {
  _id: 'report-2',
  clientFile: {
    _id: 'client-file-2',
    lastName: 'Dupont',
    firstName: 'Jean',
    company: 'ACME Corp',
    postalCode: '75001',
    city: 'Paris',
  },
  twRegister1: 'caisse-001',
  twRegister2: 'caisse-002',
  twPc: 'pc-001',
  cashguardUnits: [
    {
      up: 'UP-1',
      ub: 'UB-1',
      cassetteSlots: ['slot1', 'slot2', 'slot3', 'slot4'],
      assignedRegisters: ['caisse-001'],
      hasPc: true,
    },
  ],
  notes: 'Some notes',
  createdAt: '2024-01-03T00:00:00.000Z',
  updatedAt: '2024-01-04T00:00:00.000Z',
};

describe('InterventionReportsEffects', () => {
  let effects: InterventionReportsEffects;
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
        InterventionReportsEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    effects = TestBed.inject(InterventionReportsEffects);
  });

  // ---------------------------------------------------------------------------
  // loadAll$
  // ---------------------------------------------------------------------------
  describe('loadAll$', () => {
    it('should dispatch loadAllSuccess with reports on success', async () => {
      const reports = [mockReport, mockReport2];
      api.get.mockReturnValue(of(reports));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(InterventionReportsActions.loadAll());
      const result = await loadAllPromise;

      expect(api.get).toHaveBeenCalledWith('api/intervention-reports');
      expect(result).toEqual(InterventionReportsActions.loadAllSuccess({ reports }));
    });

    it('should dispatch loadAllFailure with error message on API error', async () => {
      const error = new Error('Server error');
      api.get.mockReturnValue(throwError(() => error));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(InterventionReportsActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(InterventionReportsActions.loadAllFailure({ error: 'Server error' }));
    });

    it('should dispatch loadAllFailure with fallback message when error has no message', async () => {
      api.get.mockReturnValue(throwError(() => null));

      const loadAllPromise = firstValueFrom(effects.loadAll$);
      actions$.next(InterventionReportsActions.loadAll());
      const result = await loadAllPromise;

      expect(result).toEqual(InterventionReportsActions.loadAllFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // loadByClientFile$
  // ---------------------------------------------------------------------------
  describe('loadByClientFile$', () => {
    it('should dispatch loadByClientFileSuccess with reports on success', async () => {
      const reports = [mockReport];
      api.get.mockReturnValue(of(reports));

      const loadByClientFilePromise = firstValueFrom(effects.loadByClientFile$);
      actions$.next(InterventionReportsActions.loadByClientFile({ clientFileId: 'client-file-1' }));
      const result = await loadByClientFilePromise;

      expect(api.get).toHaveBeenCalledWith('api/intervention-reports', {
        clientFileId: 'client-file-1',
      });
      expect(result).toEqual(InterventionReportsActions.loadByClientFileSuccess({ reports }));
    });

    it('should dispatch loadByClientFileSuccess with empty array on API error', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Not found')));

      const loadByClientFilePromise = firstValueFrom(effects.loadByClientFile$);
      actions$.next(
        InterventionReportsActions.loadByClientFile({ clientFileId: 'client-file-99' }),
      );
      const result = await loadByClientFilePromise;

      expect(result).toEqual(InterventionReportsActions.loadByClientFileSuccess({ reports: [] }));
    });
  });

  // ---------------------------------------------------------------------------
  // loadOne$
  // ---------------------------------------------------------------------------
  describe('loadOne$', () => {
    it('should dispatch loadOneSuccess with report on success', async () => {
      api.get.mockReturnValue(of(mockReport));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(InterventionReportsActions.loadOne({ id: 'report-1' }));
      const result = await loadOnePromise;

      expect(api.get).toHaveBeenCalledWith('api/intervention-reports/report-1');
      expect(result).toEqual(InterventionReportsActions.loadOneSuccess({ report: mockReport }));
    });

    it('should dispatch loadAllFailure with generic error on API error', async () => {
      api.get.mockReturnValue(throwError(() => new Error('Not found')));

      const loadOnePromise = firstValueFrom(effects.loadOne$);
      actions$.next(InterventionReportsActions.loadOne({ id: 'report-99' }));
      const result = await loadOnePromise;

      expect(result).toEqual(InterventionReportsActions.loadAllFailure({ error: 'Erreur' }));
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

    it('should dispatch createReportSuccess and call toast.success on success', async () => {
      api.post.mockReturnValue(of(mockReport));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(InterventionReportsActions.createReport({ data: formData }));
      const result = await createPromise;

      expect(api.post).toHaveBeenCalledWith('api/intervention-reports', formData);
      expect(toast.success).toHaveBeenCalledWith('TOAST.REPORT_CREATED');
      expect(result).toEqual(
        InterventionReportsActions.createReportSuccess({ report: mockReport }),
      );
    });

    it('should dispatch createReportFailure and call toast.error on API error', async () => {
      const error = new Error('Create failed');
      api.post.mockReturnValue(throwError(() => error));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(InterventionReportsActions.createReport({ data: formData }));
      const result = await createPromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.REPORT_CREATE_ERROR');
      expect(result).toEqual(
        InterventionReportsActions.createReportFailure({ error: 'Create failed' }),
      );
    });

    it('should dispatch createReportFailure with fallback message when error has no message', async () => {
      api.post.mockReturnValue(throwError(() => null));

      const createPromise = firstValueFrom(effects.create$);
      actions$.next(InterventionReportsActions.createReport({ data: formData }));
      const result = await createPromise;

      expect(result).toEqual(InterventionReportsActions.createReportFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // update$
  // ---------------------------------------------------------------------------
  describe('update$', () => {
    const updateData = { notes: 'Updated notes' };

    it('should dispatch updateReportSuccess and call toast.success on success', async () => {
      const updatedReport: InterventionReport = { ...mockReport, notes: 'Updated notes' };
      api.put.mockReturnValue(of(updatedReport));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(InterventionReportsActions.updateReport({ id: 'report-1', data: updateData }));
      const result = await updatePromise;

      expect(api.put).toHaveBeenCalledWith('api/intervention-reports/report-1', updateData);
      expect(toast.success).toHaveBeenCalledWith('TOAST.REPORT_UPDATED');
      expect(result).toEqual(
        InterventionReportsActions.updateReportSuccess({ report: updatedReport }),
      );
    });

    it('should dispatch updateReportFailure and call toast.error on API error', async () => {
      const error = new Error('Update failed');
      api.put.mockReturnValue(throwError(() => error));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(InterventionReportsActions.updateReport({ id: 'report-1', data: updateData }));
      const result = await updatePromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.REPORT_UPDATE_ERROR');
      expect(result).toEqual(
        InterventionReportsActions.updateReportFailure({ error: 'Update failed' }),
      );
    });

    it('should dispatch updateReportFailure with fallback message when error has no message', async () => {
      api.put.mockReturnValue(throwError(() => null));

      const updatePromise = firstValueFrom(effects.update$);
      actions$.next(InterventionReportsActions.updateReport({ id: 'report-1', data: updateData }));
      const result = await updatePromise;

      expect(result).toEqual(InterventionReportsActions.updateReportFailure({ error: 'Erreur' }));
    });
  });

  // ---------------------------------------------------------------------------
  // delete$
  // ---------------------------------------------------------------------------
  describe('delete$', () => {
    it('should dispatch deleteReportSuccess and call toast.success on success', async () => {
      api.delete.mockReturnValue(of(undefined));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(InterventionReportsActions.deleteReport({ id: 'report-1' }));
      const result = await deletePromise;

      expect(api.delete).toHaveBeenCalledWith('api/intervention-reports/report-1');
      expect(toast.success).toHaveBeenCalledWith('TOAST.REPORT_DELETED');
      expect(result).toEqual(InterventionReportsActions.deleteReportSuccess({ id: 'report-1' }));
    });

    it('should dispatch deleteReportFailure and call toast.error on API error', async () => {
      const error = new Error('Delete failed');
      api.delete.mockReturnValue(throwError(() => error));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(InterventionReportsActions.deleteReport({ id: 'report-1' }));
      const result = await deletePromise;

      expect(toast.error).toHaveBeenCalledWith('TOAST.REPORT_DELETE_ERROR');
      expect(result).toEqual(
        InterventionReportsActions.deleteReportFailure({ error: 'Delete failed' }),
      );
    });

    it('should dispatch deleteReportFailure with fallback message when error has no message', async () => {
      api.delete.mockReturnValue(throwError(() => null));

      const deletePromise = firstValueFrom(effects.delete$);
      actions$.next(InterventionReportsActions.deleteReport({ id: 'report-1' }));
      const result = await deletePromise;

      expect(result).toEqual(InterventionReportsActions.deleteReportFailure({ error: 'Erreur' }));
    });
  });
});
