import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExportModal } from './export-modal';
import type { Item } from '../../../../shared/models/item/item.model';

// Angular's Vitest builder disallows vi.mock()/vi.spyOn() on relative-path modules, so
// export.utils runs for real here - only its external dependencies (DOM anchor/URL for
// CSV, third-party libs for XLSX/PDF) are mocked, same as export.utils.spec.ts does.

let lastCreatedLink: Record<string, unknown> = {};

const items: Item[] = [
  { _id: '1', posterId: 'u1', name: 'Joint', quantity: 5, supplier: 'Alpha', status: 'Neuf' },
];

describe('ExportModal', () => {
  let component: ExportModal;
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

    TestBed.overrideComponent(ExportModal, { set: { template: '', imports: [] } });
    await TestBed.configureTestingModule({ imports: [ExportModal] }).compileComponents();

    const fixture = TestBed.createComponent(ExportModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', items);
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

  it('exportJSON() triggers a JSON download and closes the modal', () => {
    component.exportJSON();
    expect(lastCreatedLink['download']).toMatch(/\.json$/);
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
