import type { Item } from "../types";

export function exportItemsToCSV(items: Item[]) {
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

  const csvContent =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"),
      )
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
