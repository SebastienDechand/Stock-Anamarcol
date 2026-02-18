import type { Item } from "../types";

export async function exportToXLSX(items: Item[], filename?: string) {
  const XLSX = await import("xlsx");
  const headers = [
    "Dénomination",
    "Fournisseur",
    "État",
    "Quantité",
    "Prépa CG",

    "Prépa TPV",
  ];

  const data = items.map((item) => ({
    Dénomination: item.denomination,
    Fournisseur: item.fournisseur,
    État: item.etat,
    Quantité: Number(item.quantite),
    "Prépa CG": item.prepaCG ? "Oui" : "Non",

    "Prépa TPV": item.prepaTPV ? "Oui" : "Non",
  }));

  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stock");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  downloadBlob(
    blob,
    filename || `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export async function exportToPDF(items: Item[], filename?: string) {
  const { jsPDF } = await import("jspdf");
  // plugin attaches itself to global jsPDF autoTable
  await import("jspdf-autotable");

  const headers = [
    "Dénomination",
    "Fournisseur",
    "État",
    "Quantité",
    "Prépa CG",

    "Prépa TPV",
  ];

  const rows = items.map((item) => [
    item.denomination,
    item.fournisseur,
    item.etat,
    String(item.quantite),
    item.prepaCG ? "Oui" : "Non",

    item.prepaTPV ? "Oui" : "Non",
  ]);

  const doc = new jsPDF();
  // jspdf-autotable augments jsPDF prototype at runtime
  (
    doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }
  ).autoTable({ head: [headers], body: rows, styles: { fontSize: 8 } });
  doc.save(
    filename || `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

export function exportToJSON(items: Item[], filename?: string) {
  const blob = new Blob([JSON.stringify(items, null, 2)], {
    type: "application/json",
  });
  downloadBlob(
    blob,
    filename || `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.json`,
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default {};
