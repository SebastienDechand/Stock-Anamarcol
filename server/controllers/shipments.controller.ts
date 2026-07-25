import { Request, Response } from "express";
import ShipmentModel from "../models/shipment.model";
import type { IShipment } from "../models/shipment.model";
import ShipmentArchiveModel from "../models/shipmentArchive.model";
import type { IShipmentArchive } from "../models/shipmentArchive.model";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { validateObjectId } from "../utils/validate.utils";
import { handleError } from "../utils/response.utils";
import { ErrorCode } from "../constants/errorCodes";

/**
 * Archive shipments for a specific calendar month.
 * @param year  Full year, e.g. 2026
 * @param month 0-indexed month (0 = January)
 */
async function performArchiveForMonth(
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
async function autoArchiveIfNeeded(): Promise<void> {
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

export const getShipments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await autoArchiveIfNeeded();
    const { clientFileId } = req.query;
    const filter: Record<string, unknown> = {};
    if (clientFileId && typeof clientFileId === "string")
      filter.clientFile = clientFileId;
    const shipments = await ShipmentModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(shipments);
  } catch (err) {
    handleError(res, err, "Error fetching shipments:");
  }
};

export const createShipment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    lastName,
    firstName,
    phone,
    phone2,
    email,
    address,
    postalCode,
    city,
    companyOrRole,
    company,
    part,
    requestDate,
    clientFile,
  } = req.body;

  // Validate required fields
  const missing: string[] = [];
  if (!lastName) missing.push("lastName");
  if (!firstName) missing.push("firstName");
  if (!address) missing.push("address");
  if (!postalCode) missing.push("postalCode");
  if (!city) missing.push("city");
  if (!companyOrRole) missing.push("companyOrRole");
  if (!company) missing.push("company");
  if (!part) missing.push("part");
  if (missing.length > 0) {
    res.status(400).json({
      message: `Missing required fields: ${missing.join(", ")}`,
      code: ErrorCode.SHIPMENT_MISSING_FIELDS,
    });
    return;
  }

  try {
    const created = await ShipmentModel.create({
      lastName,
      firstName,
      phone: phone || undefined,
      phone2: phone2 || undefined,
      email: email || undefined,
      address,
      postalCode,
      city,
      companyOrRole,
      company,
      part,
      clientFile: clientFile || undefined,
      requestDate: requestDate ? new Date(requestDate) : undefined,
      createdBy: res.locals.user?._id?.toString(),
      createdByName: res.locals.user?.username,
    });
    res.status(201).json(created);
  } catch (err) {
    handleError(res, err, "Error creating shipment:");
  }
};

export const markSent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!validateObjectId(id, res)) return;

    const shipment = await ShipmentModel.findById(id);
    if (!shipment) {
      res.status(404).json({
        message: "Shipment not found",
        code: ErrorCode.SHIPMENT_NOT_FOUND,
      });
      return;
    }
    shipment.sent = true;
    shipment.sentAt = new Date();
    shipment.sentBy = res.locals.user?.username;
    const updated = await shipment.save();
    res.status(200).json(updated);
  } catch (err) {
    handleError(res, err, "Error marking shipment sent:");
  }
};

export const deleteShipment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!validateObjectId(id, res)) return;

    await ShipmentModel.deleteOne({ _id: id }).exec();
    res
      .status(200)
      .json({ message: "Deleted", code: ErrorCode.SHIPMENT_DELETED });
  } catch (err) {
    handleError(res, err, "Error deleting shipment:");
  }
};

/**
 * Manually archive all current shipments (current month) into a PDF
 * stored in DB, then purge them. Admin / superadmin only.
 */
export const createArchive = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const now = new Date();
    const archive = await performArchiveForMonth(
      now.getFullYear(),
      now.getMonth(),
    );
    if (!archive) {
      res.status(400).json({
        message: "No shipments to archive",
        code: ErrorCode.NO_SHIPMENTS_TO_ARCHIVE,
      });
      return;
    }
    res.status(201).json({
      _id: archive._id,
      title: archive.title,
      periodStart: archive.periodStart,
      periodEnd: archive.periodEnd,
      shipmentCount: archive.shipmentCount,
      createdAt: archive.createdAt,
    });
  } catch (err) {
    handleError(res, err, "Error creating shipment archive:");
  }
};

/**
 * List all archives (without the file buffer).
 */
export const getArchives = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const archives = await ShipmentArchiveModel.find()
      .select("-fileBuffer")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(archives);
  } catch (err) {
    handleError(res, err, "Error fetching archives:");
  }
};

/**
 * Download an archive file (PDF or XLSX).
 * Use ?format=xlsx to get an Excel file. Defaults to PDF.
 */
export const downloadArchive = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!validateObjectId(req.params.id as string, res)) return;

    const archive = await ShipmentArchiveModel.findById(req.params.id).lean();
    if (!archive) {
      res
        .status(404)
        .json({ message: "Archive not found", code: ErrorCode.ARCHIVE_NOT_FOUND });
      return;
    }

    const format = (req.query.format as string)?.toLowerCase();
    const safeTitle = archive.title.replace(
      /[^a-zA-Z0-9\u00e0\u00e2\u00e9\u00e8\u00ea\u00eb\u00ef\u00ee\u00f4\u00f9\u00fb\u00fc\u00e7\s-]/g,
      "",
    );

    if (format === "xlsx") {
      if (!archive.rawData || archive.rawData.length === 0) {
        res.status(400).json({
          message: "XLSX data not available for this archive",
          code: ErrorCode.ARCHIVE_XLSX_UNAVAILABLE,
        });
        return;
      }
      const ws = XLSX.utils.json_to_sheet(archive.rawData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Envois");
      const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Length", xlsxBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="envois-${safeTitle}.xlsx"`,
      );
      res.end(xlsxBuffer);
    } else {
      // Default: PDF - Mongoose lean() may return BSON Binary; ensure proper Buffer
      const raw = archive.fileBuffer;
      const pdfBuffer = Buffer.isBuffer(raw)
        ? raw
        : Buffer.from((raw as { buffer?: ArrayBuffer }).buffer ?? raw);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="envois-${safeTitle}.pdf"`,
      );
      res.end(pdfBuffer);
    }
  } catch (err) {
    handleError(res, err, "Error downloading archive:");
  }
};
