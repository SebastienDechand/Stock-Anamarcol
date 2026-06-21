import { Shipment } from '../models/shipment.model';
import { downloadBlob } from './download.utils';

function toRows(shipments: Shipment[]) {
  return shipments.map((shipment) => ({
    Statut: shipment.sent ? 'Envoyé' : 'En attente',
    Nom: shipment.nom,
    Prénom: shipment.prenom,
    Société: shipment.societe,
    'Société / Fonction': shipment.societeOuFonction,
    Pièce: shipment.piece,
    Adresse: shipment.adresse,
    CP: shipment.codePostal,
    Ville: shipment.ville,
    Tél: shipment.tel || '',
    'Tél 2': shipment.tel2 || '',
    Email: shipment.email || '',
    'Envoyé par': shipment.sentBy || '',
    'Créé par': shipment.createdByName || '',
    'Date création': shipment.createdAt ? new Date(shipment.createdAt).toLocaleString('fr-FR') : '',
  }));
}

export function exportShipmentsToCSV(shipments: Shipment[]): void {
  const rows = toRows(shipments);
  const headers = Object.keys(rows[0] ?? {});
  const csvContent =
    '﻿' +
    [headers, ...rows.map((row) => Object.values(row))]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `envois-anamarcol-${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportShipmentsToXLSX(shipments: Shipment[]): Promise<void> {
  const { utils, writeFile } = await import('@e965/xlsx');
  const ws = utils.json_to_sheet(toRows(shipments));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Envois');
  writeFile(wb, `envois-anamarcol-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportShipmentsToPDF(shipments: Shipment[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text('Liste des envois', 14, 18);
  doc.setFontSize(9);
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 24);

  const rows = toRows(shipments);
  const columns = Object.keys(rows[0] ?? {});
  autoTable(doc, {
    startY: 28,
    head: [columns],
    body: rows.map((row) => Object.values(row)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 74, 42] },
  });

  doc.save(`envois-anamarcol-${new Date().toISOString().slice(0, 10)}.pdf`);
}
