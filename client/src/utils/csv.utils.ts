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
    item.name,
    item.supplier,
    item.status,
    String(item.quantity),
    item.cgKit ? "Oui" : "Non",
    item.tpvKit ? "Oui" : "Non",
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
