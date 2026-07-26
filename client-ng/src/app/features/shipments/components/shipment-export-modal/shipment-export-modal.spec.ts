import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShipmentExportModal } from './shipment-export-modal';
import type { Shipment } from '../../../../shared/models/shipment/shipment.model';

// Angular's Vitest builder disallows vi.mock()/vi.spyOn() on relative-path modules, so
// shipment-export.utils runs for real here - only its external dependencies (DOM anchor/URL
// for CSV, third-party libs for XLSX/PDF) are mocked, same as shipment-export.utils.spec.ts.

let lastCreatedLink: Record<string, unknown> = {};

const shipments: Shipment[] = [
  {
    _id: '1',
    lastName: 'Dupont',
    firstName: 'Jean',
    address: '1 rue de la Paix',
    postalCode: '75000',
    city: 'Paris',
    companyOrRole: '',
    company: '',
    part: 'Carte mère',
  },
];

describe('ShipmentExportModal', () => {
  let component: ShipmentExportModal;
  let cancelledSpy: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(async () => {
    lastCreatedLink = {};
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn(),
      }),
    );
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: unknown) => {
      if (tagName !== 'a') return realCreateElement(tagName, options as ElementCreationOptions);
      const el: Record<string, unknown> = { href: '', download: '', click: vi.fn() };
      lastCreatedLink = el;
      return el as unknown as HTMLElement;
    });

    TestBed.overrideComponent(ShipmentExportModal, { set: { template: '', imports: [] } });
    await TestBed.configureTestingModule({ imports: [ShipmentExportModal] }).compileComponents();

    const fixture = TestBed.createComponent(ShipmentExportModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('shipments', shipments);
    fixture.detectChanges();

    cancelledSpy = vi.fn(() => {});
    component.cancelled.subscribe(cancelledSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exportCSV() triggers a CSV download and closes the modal', () => {
    component.exportCSV();
    expect(lastCreatedLink['download']).toMatch(/\.csv$/);
    expect(lastCreatedLink['click']).toHaveBeenCalled();
    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('exportXLSX() writes the workbook and closes the modal', async () => {
    const mockWriteFile = vi.fn();
    vi.doMock('@e965/xlsx', () => ({
      utils: {
        json_to_sheet: vi.fn().mockReturnValue({}),
        book_new: vi.fn().mockReturnValue({}),
        book_append_sheet: vi.fn(),
      },
      writeFile: mockWriteFile,
    }));

    await component.exportXLSX();

    expect(mockWriteFile).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/\.xlsx$/));
    expect(cancelledSpy).toHaveBeenCalled();
    vi.doUnmock('@e965/xlsx');
  });

  it('exportPDF() saves the document and closes the modal', async () => {
    const mockSave = vi.fn();
    const mockAutoTable = vi.fn();
    vi.doMock('jspdf', () => ({
      jsPDF: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
        this['setFontSize'] = vi.fn();
        this['text'] = vi.fn();
        this['save'] = mockSave;
      }),
    }));
    vi.doMock('jspdf-autotable', () => ({ default: mockAutoTable }));

    await component.exportPDF();

    expect(mockSave).toHaveBeenCalledWith(expect.stringMatching(/\.pdf$/));
    expect(cancelledSpy).toHaveBeenCalled();
    vi.doUnmock('jspdf');
    vi.doUnmock('jspdf-autotable');
  });
});
