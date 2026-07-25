import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Item } from '../../models/item/item.model';

let lastCreatedLink: Record<string, unknown> = {};
let lastRevokedUrl = '';

beforeEach(() => {
  lastCreatedLink = {};
  lastRevokedUrl = '';

  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn((url: string) => {
        lastRevokedUrl = url;
      }),
    }),
  );

  vi.spyOn(document, 'createElement').mockImplementation(() => {
    const el: Record<string, unknown> = {
      href: '',
      download: '',
      click: vi.fn(),
      setAttribute: vi.fn(),
      style: {},
    };
    lastCreatedLink = el;
    return el as unknown as HTMLElement;
  });
});

const sampleItems: Item[] = [
  {
    _id: '1',
    posterId: 'u1',
    name: 'Joint Hooper',
    quantity: 10,
    supplier: 'Alpha',
    status: 'Neuf',
    cgKit: true,
    tpvKit: false,
  },
  {
    _id: '2',
    posterId: 'u1',
    name: 'Cassette',
    quantity: 3,
    supplier: 'Beta',
    status: 'Reconditionné',
    cgKit: false,
    tpvKit: true,
  },
];

describe('exportItemsToCSV', () => {
  it('should generate a CSV file and trigger download', async () => {
    const { exportItemsToCSV } = await import('./export.utils');
    exportItemsToCSV(sampleItems);

    expect(lastCreatedLink['download']).toMatch(/^stock-anamarcol-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(lastCreatedLink['click'] as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    expect(lastRevokedUrl).toBe('blob:mock-url');
  });
});

describe('exportItemsToXLSX', () => {
  it('should build a worksheet and write the file', async () => {
    const mockWriteFile = vi.fn();
    const mockBookNew = vi.fn().mockReturnValue({});
    const mockJsonToSheet = vi.fn().mockReturnValue({});
    const mockBookAppendSheet = vi.fn();

    vi.doMock('@e965/xlsx', () => ({
      utils: {
        json_to_sheet: mockJsonToSheet,
        book_new: mockBookNew,
        book_append_sheet: mockBookAppendSheet,
      },
      writeFile: mockWriteFile,
    }));

    const { exportItemsToXLSX } = await import('./export.utils');
    await exportItemsToXLSX(sampleItems);

    expect(mockJsonToSheet).toHaveBeenCalled();
    expect(mockBookAppendSheet).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^stock-anamarcol-\d{4}-\d{2}-\d{2}\.xlsx$/),
    );

    vi.doUnmock('@e965/xlsx');
  });
});

describe('exportItemsToPDF', () => {
  it('should build a table and trigger save', async () => {
    const mockSave = vi.fn();
    const mockSetFontSize = vi.fn();
    const mockText = vi.fn();
    const mockAutoTable = vi.fn();

    vi.doMock('jspdf', () => ({
      jsPDF: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
        this['setFontSize'] = mockSetFontSize;
        this['text'] = mockText;
        this['save'] = mockSave;
      }),
    }));
    vi.doMock('jspdf-autotable', () => ({ default: mockAutoTable }));

    const { exportItemsToPDF } = await import('./export.utils');
    await exportItemsToPDF(sampleItems);

    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        head: expect.any(Array),
        body: expect.any(Array),
      }),
    );
    expect(mockSave).toHaveBeenCalledWith(
      expect.stringMatching(/^stock-anamarcol-\d{4}-\d{2}-\d{2}\.pdf$/),
    );

    vi.doUnmock('jspdf');
    vi.doUnmock('jspdf-autotable');
  });
});

describe('exportItemsToJSON', () => {
  it('should create a JSON blob and trigger download', async () => {
    const { exportItemsToJSON } = await import('./export.utils');
    exportItemsToJSON(sampleItems);

    expect(lastCreatedLink['download']).toMatch(/^stock-anamarcol-\d{4}-\d{2}-\d{2}\.json$/);
    expect(lastCreatedLink['click'] as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    expect(lastRevokedUrl).toBe('blob:mock-url');
  });
});
