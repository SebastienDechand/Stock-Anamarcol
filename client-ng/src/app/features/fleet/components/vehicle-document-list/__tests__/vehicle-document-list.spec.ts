import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VehicleDocumentList } from '../vehicle-document-list';
import { ToastService } from '../../../../../core/toast/toast.service';
import { LanguageService } from '../../../../../core/services/language.service';
import type { Vehicle } from '../../../../../shared/models/vehicle.model';
import { environment } from '../../../../../../environments/environment';

const sampleVehicle: Vehicle = {
  _id: 'v1',
  brand: 'mercedes',
  model: 'citan',
  format: 'van',
  licensePlate: 'AB-123-CD',
  documents: [
    {
      _id: 'd1',
      name: 'Facture',
      filename: '123-abc.pdf',
      type: 'service_invoice',
      uploadedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

describe('VehicleDocumentList', () => {
  let component: VehicleDocumentList;

  beforeEach(() => {
    TestBed.overrideComponent(VehicleDocumentList, { set: { template: '', imports: [] } });
    TestBed.configureTestingModule({
      imports: [VehicleDocumentList],
      providers: [
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LanguageService, useValue: { current: 'fr' } },
      ],
    });

    const fixture = TestBed.createComponent(VehicleDocumentList);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('vehicle', sampleVehicle);
    fixture.detectChanges();
  });

  function makeFileChangeEvent(file: File): Event {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [file] });
    return { target: input } as unknown as Event;
  }

  describe('onFileChange()', () => {
    it('accepts a file with an allowed extension and size', () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      component.onFileChange(makeFileChangeEvent(file));

      expect(component.selectedFile).toBe(file);
      expect(component.selectedDocName).toBe('doc');
    });

    it('rejects a file with a disallowed extension', () => {
      const toast = TestBed.inject(ToastService);
      const file = new File(['data'], 'archive.zip', { type: 'application/zip' });

      component.onFileChange(makeFileChangeEvent(file));

      expect(component.selectedFile).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('TOAST.VEHICLE_DOC_INVALID_TYPE');
    });

    it('rejects a file larger than 10 MB', () => {
      const toast = TestBed.inject(ToastService);
      const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.pdf', {
        type: 'application/pdf',
      });

      component.onFileChange(makeFileChangeEvent(oversized));

      expect(component.selectedFile).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('TOAST.VEHICLE_DOC_TOO_LARGE');
    });
  });

  describe('submitUpload()', () => {
    it('sends the file under the "file" field expected by multer', () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      component.selectedFile = file;
      component.selectedDocName = 'Mon document';
      component.selectedDocType = 'inspection';

      let emitted: { id: string; formData: FormData } | undefined;
      component.uploadDocument.subscribe((e) => (emitted = e));

      component.submitUpload();

      expect(emitted?.id).toBe('v1');
      expect(emitted?.formData.get('file')).toBe(file);
      expect(emitted?.formData.get('docName')).toBe('Mon document');
      expect(emitted?.formData.get('docType')).toBe('inspection');
      // These field names must NOT be used - they don't match the backend
      // (server/routes/vehicle.routes.ts uses upload.single("file"), and
      // server/controllers/vehicle.controller.ts reads req.body.docType / docName).
      expect(emitted?.formData.get('document')).toBeNull();
      expect(emitted?.formData.get('name')).toBeNull();
      expect(emitted?.formData.get('type')).toBeNull();
    });

    it('resets the form after emitting', () => {
      component.selectedFile = new File(['data'], 'doc.pdf');
      component.selectedDocName = 'Mon document';
      component.selectedDocType = 'inspection';

      component.submitUpload();

      expect(component.selectedFile).toBeNull();
      expect(component.selectedDocName).toBe('');
      expect(component.selectedDocType).toBe('other');
    });

    it('does nothing when no file is selected', () => {
      component.selectedFile = null;
      component.selectedDocName = 'Mon document';

      let emitted = false;
      component.uploadDocument.subscribe(() => (emitted = true));

      component.submitUpload();

      expect(emitted).toBe(false);
    });
  });

  describe('fileUrl()', () => {
    it('builds the download URL from the vehicle document filename', () => {
      const url = component.fileUrl(sampleVehicle.documents[0]);
      expect(url).toBe(`${environment.apiUrl}uploads/vehicules/123-abc.pdf`);
    });
  });
});
