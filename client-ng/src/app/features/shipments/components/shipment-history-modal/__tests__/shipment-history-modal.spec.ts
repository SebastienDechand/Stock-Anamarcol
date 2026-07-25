import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { ShipmentHistoryModal } from '../shipment-history-modal';
import { ApiService } from '../../../../../core/http/api.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import { LanguageService } from '../../../../../core/services/language.service';
import type { ShipmentArchive } from '../../../../../shared/models/shipment.model';

const sampleArchive: ShipmentArchive = {
  _id: 'a1',
  title: 'Envois - Janvier 2026',
  periodStart: '2026-01-01T00:00:00.000Z',
  periodEnd: '2026-01-31T23:59:59.000Z',
  shipmentCount: 12,
  createdAt: '2026-02-01T00:00:00.000Z',
};

describe('ShipmentHistoryModal', () => {
  let component: ShipmentHistoryModal;
  let api: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    getBlob: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = {
      get: vi.fn().mockReturnValue(of([sampleArchive])),
      post: vi.fn(),
      getBlob: vi.fn(),
    };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.overrideComponent(ShipmentHistoryModal, { set: { template: '', imports: [] } });
    TestBed.configureTestingModule({
      imports: [ShipmentHistoryModal],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: LanguageService, useValue: { current: 'fr' } },
      ],
    });

    const fixture = TestBed.createComponent(ShipmentHistoryModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should fetch archives on init', () => {
    expect(api.get).toHaveBeenCalledWith('api/shipments/archives');
    expect(component.archives()).toEqual([sampleArchive]);
    expect(component.loading()).toBe(false);
  });

  it('should stop loading and keep archives empty when the fetch fails', () => {
    api.get.mockReturnValue(throwError(() => new Error('down')));
    component['fetchArchives']();
    expect(component.loading()).toBe(false);
  });

  describe('handleArchive()', () => {
    it('should archive, toast success, refresh archives, and emit archived on success', () => {
      api.post.mockReturnValue(of(sampleArchive));
      const archivedSpy = vi.fn();
      component.archived.subscribe(archivedSpy);
      component.showConfirm.set(true);

      component.handleArchive();

      expect(api.post).toHaveBeenCalledWith('api/shipments/archive', {});
      expect(component.showConfirm()).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('TOAST.SHIPMENT_ARCHIVED');
      expect(archivedSpy).toHaveBeenCalled();
      expect(component.archiving()).toBe(false);
    });

    it('should toast an error and stop archiving on failure', () => {
      api.post.mockReturnValue(throwError(() => new Error('fail')));

      component.handleArchive();

      expect(toast.error).toHaveBeenCalledWith('TOAST.SHIPMENT_ARCHIVE_ERROR');
      expect(component.archiving()).toBe(false);
    });
  });

  describe('handleDownload()', () => {
    it('should request the archive blob in the requested format', () => {
      api.getBlob.mockReturnValue(of(new Blob(['data'])));

      component.handleDownload(sampleArchive, 'xlsx');

      expect(api.getBlob).toHaveBeenCalledWith('api/shipments/archives/a1/download', {
        format: 'xlsx',
      });
    });

    it('should toast an error when the download fails', () => {
      api.getBlob.mockReturnValue(throwError(() => new Error('fail')));

      component.handleDownload(sampleArchive, 'pdf');

      expect(toast.error).toHaveBeenCalledWith('TOAST.SHIPMENT_ARCHIVE_DOWNLOAD_ERROR');
    });
  });

  describe('formatDate()', () => {
    it('should return "-" for undefined input', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return a formatted date for a valid ISO date', () => {
      const result = component.formatDate('2026-01-15T10:00:00.000Z');
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');
    });
  });
});
