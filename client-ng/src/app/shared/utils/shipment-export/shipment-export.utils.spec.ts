import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Shipment } from '../../models/shipment/shipment.model';

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

const sampleShipments: Shipment[] = [
  {
    _id: '1',
    lastName: 'Dupont',
    firstName: 'Jean',
    address: '1 rue de la Paix',
    postalCode: '75000',
    city: 'Paris',
    companyOrRole: 'Gérant',
    company: 'SARL Dupont',
    part: 'Carte mère',
    sent: true,
    sentBy: 'admin',
    createdByName: 'admin',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '2',
    lastName: 'Martin',
    firstName: 'Alice',
    address: '2 avenue des Champs',
    postalCode: '69000',
    city: 'Lyon',
    companyOrRole: '',
    company: '',
    part: 'Alimentation',
    sent: false,
  },
];

describe('exportShipmentsToCSV', () => {
  it('should generate a CSV file and trigger download', async () => {
    const { exportShipmentsToCSV } = await import('./shipment-export.utils');
    exportShipmentsToCSV(sampleShipments);

    expect(lastCreatedLink['download']).toMatch(/^envois-anamarcol-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(lastCreatedLink['click'] as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    expect(lastRevokedUrl).toBe('blob:mock-url');
  });
});

describe('exportShipmentsToXLSX', () => {
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

    const { exportShipmentsToXLSX } = await import('./shipment-export.utils');
    await exportShipmentsToXLSX(sampleShipments);

    expect(mockJsonToSheet).toHaveBeenCalled();
    expect(mockBookAppendSheet).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^envois-anamarcol-\d{4}-\d{2}-\d{2}\.xlsx$/),
    );

    vi.doUnmock('@e965/xlsx');
  });
});

describe('exportShipmentsToPDF', () => {
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

    const { exportShipmentsToPDF } = await import('./shipment-export.utils');
    await exportShipmentsToPDF(sampleShipments);

    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        head: expect.any(Array),
        body: expect.any(Array),
      }),
    );
    expect(mockSave).toHaveBeenCalledWith(
      expect.stringMatching(/^envois-anamarcol-\d{4}-\d{2}-\d{2}\.pdf$/),
    );

    vi.doUnmock('jspdf');
    vi.doUnmock('jspdf-autotable');
  });
});
