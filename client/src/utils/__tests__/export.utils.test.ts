import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Item } from "../../types";

// ── Mock DOM APIs ──
let lastCreatedLink: Record<string, unknown> = {};
let lastRevokedUrl = "";

beforeEach(() => {
  lastCreatedLink = {};
  lastRevokedUrl = "";

  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn((url: string) => {
        lastRevokedUrl = url;
      }),
    }),
  );

  vi.spyOn(document, "createElement").mockImplementation(() => {
    const el: Record<string, unknown> = {
      href: "",
      download: "",
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
    _id: "1",
    posterId: "u1",
    denomination: "Joint Hooper",
    quantite: 10,
    fournisseur: "Alpha",
    etat: "Neuf",
    prepaCG: true,
    prepaTPV: false,
  },
  {
    _id: "2",
    posterId: "u1",
    denomination: "Cassette",
    quantite: 3,
    fournisseur: "Beta",
    etat: "Reconditionné",
    prepaCG: false,
    prepaTPV: true,
  },
];

describe("exportToXLSX", () => {
  it("should generate an XLSX file and trigger download", async () => {
    // Mock the xlsx dynamic import
    const mockWrite = vi.fn().mockReturnValue(new ArrayBuffer(10));
    const mockBookNew = vi.fn().mockReturnValue({});
    const mockJsonToSheet = vi.fn().mockReturnValue({});
    const mockBookAppendSheet = vi.fn();

    vi.doMock("xlsx", () => ({
      utils: {
        json_to_sheet: mockJsonToSheet,
        book_new: mockBookNew,
        book_append_sheet: mockBookAppendSheet,
      },
      write: mockWrite,
    }));

    // Re-import to pick up new mock
    const { exportToXLSX } = await import("../export.utils");
    await exportToXLSX(sampleItems, "test.xlsx");

    expect(mockJsonToSheet).toHaveBeenCalled();
    expect(mockBookAppendSheet).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();
    expect(lastCreatedLink.download).toBe("test.xlsx");
    expect(
      lastCreatedLink.click as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalled();
  });

  it("should use default filename when none provided", async () => {
    const mockWrite = vi.fn().mockReturnValue(new ArrayBuffer(10));
    vi.doMock("xlsx", () => ({
      utils: {
        json_to_sheet: vi.fn().mockReturnValue({}),
        book_new: vi.fn().mockReturnValue({}),
        book_append_sheet: vi.fn(),
      },
      write: mockWrite,
    }));

    const { exportToXLSX } = await import("../export.utils");
    await exportToXLSX(sampleItems);

    const dl = lastCreatedLink.download as string;
    expect(dl).toMatch(/^stock-anamarcol-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});

describe("exportToPDF", () => {
  it("should generate a PDF and trigger save", async () => {
    const mockSave = vi.fn();
    const mockAutoTable = vi.fn();

    vi.doMock("jspdf", () => ({
      jsPDF: vi.fn().mockImplementation(() => ({
        autoTable: mockAutoTable,
        save: mockSave,
      })),
    }));
    vi.doMock("jspdf-autotable", () => ({}));

    const { exportToPDF } = await import("../export.utils");
    await exportToPDF(sampleItems, "test.pdf");

    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.objectContaining({
        head: expect.any(Array),
        body: expect.any(Array),
      }),
    );
    expect(mockSave).toHaveBeenCalledWith("test.pdf");
  });
});

describe("exportToJSON", () => {
  it("should create a JSON blob and trigger download", async () => {
    // exportToJSON is synchronous, no dynamic import needed (but re-import for clean state)
    const { exportToJSON } = await import("../export.utils");
    exportToJSON(sampleItems, "test.json");

    expect(lastCreatedLink.download).toBe("test.json");
    expect(
      lastCreatedLink.click as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalled();
    expect(lastRevokedUrl).toBe("blob:mock-url");
  });

  it("should use default filename when none provided", async () => {
    const { exportToJSON } = await import("../export.utils");
    exportToJSON(sampleItems);

    const dl = lastCreatedLink.download as string;
    expect(dl).toMatch(/^stock-anamarcol-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
