import { Item } from '../models/item.model';
import { downloadBlob } from './download.utils';

export function exportItemsToCSV(items: Item[]): void {
  const headers = ['Dénomination', 'Fournisseur', 'État', 'Quantité', 'Prépa CG', 'Prépa TPV'];
  const rows = items.map((item) => [
    item.name,
    item.supplier,
    item.status,
    String(item.quantity),
    item.cgKit ? 'Oui' : 'Non',
    item.tpvKit ? 'Oui' : 'Non',
  ]);

  const csvContent =
    '﻿' +
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportItemsToXLSX(items: Item[]): Promise<void> {
  const { utils, writeFile } = await import('@e965/xlsx');
  const data = items.map((item) => ({
    Dénomination: item.name,
    Fournisseur: item.supplier,
    État: item.status,
    Quantité: item.quantity,
    'Prépa CG': item.cgKit ? 'Oui' : 'Non',
    'Prépa TPV': item.tpvKit ? 'Oui' : 'Non',
  }));
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Stock');
  writeFile(wb, `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportItemsToPDF(items: Item[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('Stock Anamarcol', 14, 16);
  doc.setFontSize(10);
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [['Dénomination', 'Fournisseur', 'État', 'Quantité', 'Prépa CG', 'Prépa TPV']],
    body: items.map((item) => [
      item.name,
      item.supplier,
      item.status,
      item.quantity,
      item.cgKit ? 'Oui' : 'Non',
      item.tpvKit ? 'Oui' : 'Non',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 74, 42] },
  });

  doc.save(`stock-anamarcol-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportItemsToJSON(items: Item[]): void {
  const json = JSON.stringify(items, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.json`);
}
