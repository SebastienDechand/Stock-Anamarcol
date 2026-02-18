import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Item } from "../../types";

let lastCreatedLink: Record<string, unknown> = {};
let lastRevokedUrl = "";

beforeEach(() => {
  lastCreatedLink = {};
  lastRevokedUrl = "";

  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:csv-url"),
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
    denomination: 'With "Quotes"',
    quantite: 5,
    fournisseur: "Beta",
    etat: "Reconditionné",
    prepaCG: false,
    prepaTPV: true,
  },
];

describe("exportItemsToCSV", () => {
  it("should create a CSV with BOM and semicolons", async () => {
    // Capture the Blob content
    const origBlob = globalThis.Blob;
    let capturedContent = "";
    vi.stubGlobal(
      "Blob",
      class MockBlob {
        content: string;
        constructor(parts: string[]) {
          this.content = parts.join("");
          capturedContent = this.content;
        }
      },
    );

    const { exportItemsToCSV } = await import("../csv.utils");
    exportItemsToCSV(sampleItems);

    // CSV starts with BOM
    expect(capturedContent.charCodeAt(0)).toBe(0xfeff);

    // Semicolon separator
    const lines = capturedContent.slice(1).split("\n");
    expect(lines[0]).toContain(";");

    // Header row
    expect(lines[0]).toContain("Dénomination");
    expect(lines[0]).toContain("Fournisseur");
    expect(lines[0]).toContain("Quantité");

    // Data rows
    expect(lines[1]).toContain("Joint Hooper");
    expect(lines[1]).toContain("Alpha");
    expect(lines[1]).toContain("Oui"); // prepaCG

    // Quotes are escaped
    expect(lines[2]).toContain('""Quotes""');

    vi.stubGlobal("Blob", origBlob);
  });

  it("should trigger download with correct filename", async () => {
    const { exportItemsToCSV } = await import("../csv.utils");
    exportItemsToCSV(sampleItems);

    const dl = lastCreatedLink.download as string;
    expect(dl).toMatch(/^stock-anamarcol-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(
      lastCreatedLink.click as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalled();
    expect(lastRevokedUrl).toBe("blob:csv-url");
  });

  it("should handle empty array without error", async () => {
    const { exportItemsToCSV } = await import("../csv.utils");
    expect(() => exportItemsToCSV([])).not.toThrow();
    // Only header row in CSV
    const dl = lastCreatedLink.download as string;
    expect(dl).toMatch(/\.csv$/);
  });
});
