import ShipmentModel from "../models/shipment.model";
import type { IShipment } from "../models/shipment.model";
import ShipmentArchiveModel from "../models/shipmentArchive.model";
import type { IShipmentArchive } from "../models/shipmentArchive.model";
import PDFDocument from "pdfkit";

export function listShipments(filter: Record<string, unknown>) {
  return ShipmentModel.find(filter).sort({ createdAt: -1 }).lean();
}

export function createShipment(data: Partial<IShipment>) {
  return ShipmentModel.create(data);
}

export function findShipmentDocument(id: string) {
  return ShipmentModel.findById(id);
}

export function deleteShipmentById(id: string) {
  return ShipmentModel.deleteOne({ _id: id }).exec();
}

export function listArchives() {
  return ShipmentArchiveModel.find()
    .select("-fileBuffer")
    .sort({ createdAt: -1 })
    .lean();
}

export function findArchiveById(id: string) {
  return ShipmentArchiveModel.findById(id).lean();
}

/**
 * Archive shipments for a specific calendar month.
 * @param year  Full year, e.g. 2026
 * @param month 0-indexed month (0 = January)
 */
export async function performArchiveForMonth(
  year: number,
  month: number,
): Promise<IShipmentArchive | null> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1); // exclusive

  const shipments = await ShipmentModel.find({
    createdAt: { $gte: start, $lt: end },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (shipments.length === 0) return null;

  const monthName = start.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const title = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // #region Generate PDF
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 20,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(14).text(`Envois – ${title}`, { align: "center" });
    doc.moveDown(0.2);
    doc
      .fontSize(8)
      .fillColor("#666")
      .text(
        `Exporté le ${new Date().toLocaleDateString("fr-FR")} · ${shipments.length} envoi${shipments.length > 1 ? "s" : ""}`,
        { align: "center" },
      );
    doc.moveDown(0.6);

    const cols = [
      { header: "Statut", width: 48, key: "statut" },
      { header: "Nom", width: 60, key: "lastName" },
      { header: "Prénom", width: 55, key: "firstName" },
      { header: "Société", width: 80, key: "company" },
      { header: "Pièce", width: 70, key: "part" },
      { header: "Adresse", width: 100, key: "address" },
      { header: "CP", width: 38, key: "cp" },
      { header: "Ville", width: 60, key: "city" },
      { header: "Tél", width: 70, key: "phone" },
      { header: "Envoyé par", width: 55, key: "sentBy" },
      { header: "Créé par", width: 55, key: "createdBy" },
      { header: "Date", width: 55, key: "createdAt" },
    ];
    const startX = 20;
    const headerHeight = 18;
    const fontSize = 6;
    const cellPadX = 2;
    const cellPadY = 3;
    const tableWidth = cols.reduce((s, c) => s + c.width, 0);
    let y = doc.y;

    // Utility: measure the height needed for wrapped text in a column
    const measureCellHeight = (text: string, colWidth: number): number => {
      const innerW = colWidth - cellPadX * 2;
      return doc.heightOfString(text || "", { width: innerW }) + cellPadY * 2;
    };

    // Header row
    doc.fillColor("#4a7c2e").rect(startX, y, tableWidth, headerHeight).fill();
    let x = startX;
    doc.fillColor("#ffffff").fontSize(fontSize).font("Helvetica-Bold");
    for (const col of cols) {
      doc.text(col.header, x + cellPadX, y + 5, {
        width: col.width - cellPadX * 2,
      });
      x += col.width;
    }
    y += headerHeight;

    // Data rows – dynamic height, no ellipsis
    doc.font("Helvetica").fillColor("#333333").fontSize(fontSize);
    for (let i = 0; i < shipments.length; i++) {
      const s = shipments[i];
      const values: Record<string, string> = {
        statut: s.sent ? "Envoyé" : "En attente",
        lastName: s.lastName || "",
        firstName: s.firstName || "",
        company: [s.company, s.companyOrRole].filter(Boolean).join(" / "),
        part: s.part || "",
        address: s.address || "",
        cp: s.postalCode || "",
        city: s.city || "",
        phone: [s.phone, s.phone2].filter(Boolean).join(" / "),
        sentBy: s.sentBy || "",
        createdBy: s.createdByName || "",
        createdAt: new Date(s.createdAt).toLocaleDateString("fr-FR"),
      };

      // Compute row height = max cell height
      let rowHeight = 14; // minimum
      for (const col of cols) {
        const h = measureCellHeight(values[col.key] || "", col.width);
        if (h > rowHeight) rowHeight = h;
      }

      // Page break check
      if (y + rowHeight > doc.page.height - 20) {
        doc.addPage();
        y = 20;
      }

      // Zebra stripe
      if (i % 2 === 0) {
        doc
          .save()
          .fillColor("#f3f4f6")
          .rect(startX, y, tableWidth, rowHeight)
          .fill()
          .restore();
        doc.fillColor("#333333");
      }

      x = startX;
      for (const col of cols) {
        doc.text(values[col.key] || "", x + cellPadX, y + cellPadY, {
          width: col.width - cellPadX * 2,
        });
        x += col.width;
      }
      y += rowHeight;
    }

    doc.end();
  });
  // #endregion

  // Build raw data rows for future XLSX export
  const rawData = shipments.map((s: IShipment) => ({
    Statut: s.sent ? "Envoyé" : "En attente",
    Nom: s.lastName || "",
    Prénom: s.firstName || "",
    Société: s.company || "",
    "Société / Fonction": s.companyOrRole || "",
    Pièce: s.part || "",
    Adresse: s.address || "",
    CP: s.postalCode || "",
    Ville: s.city || "",
    Tél: s.phone || "",
    "Tél 2": s.phone2 || "",
    Email: s.email || "",
    "Envoyé par": s.sentBy || "",
    "Créé par": s.createdByName || "",
    "Date création": s.createdAt
      ? new Date(s.createdAt).toLocaleDateString("fr-FR")
      : "",
  }));

  const archive = await ShipmentArchiveModel.create({
    title,
    periodStart: start,
    periodEnd: new Date(end.getTime() - 1),
    shipmentCount: shipments.length,
    fileBuffer: buffer,
    rawData,
  });

  // Remove only the archived month's shipments
  await ShipmentModel.deleteMany({
    createdAt: { $gte: start, $lt: end },
  });

  return archive;
}

/**
 * Auto-archive past calendar months: if any shipment belongs to a month
 * earlier than the current one, archive that entire month.
 */
export async function autoArchiveIfNeeded(): Promise<void> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const oldest = await ShipmentModel.findOne().sort({ createdAt: 1 }).lean();
  if (!oldest) return;

  const oldestDate = new Date(oldest.createdAt);
  let y = oldestDate.getFullYear();
  let m = oldestDate.getMonth();

  // Archive every past month that has shipments
  while (y < currentYear || (y === currentYear && m < currentMonth)) {
    await performArchiveForMonth(y, m);
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
}
