import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import * as shipmentsService from '../../services/shipments/shipments.service';
import { validateObjectId } from '../../utils/validate/validate.utils';
import { handleError } from '../../utils/response/response.utils';
import { ErrorCode } from '../../constants/errorCodes';

export const getShipments = async (req: Request, res: Response): Promise<void> => {
  try {
    await shipmentsService.autoArchiveIfNeeded();
    const { clientFileId } = req.query;
    const filter: Record<string, unknown> = {};
    if (clientFileId && typeof clientFileId === 'string') filter.clientFile = clientFileId;
    const shipments = await shipmentsService.listShipments(filter);
    res.status(200).json(shipments);
  } catch (err) {
    handleError(res, err, 'Error fetching shipments:');
  }
};

export const createShipment = async (req: Request, res: Response): Promise<void> => {
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
  if (!lastName) missing.push('lastName');
  if (!firstName) missing.push('firstName');
  if (!address) missing.push('address');
  if (!postalCode) missing.push('postalCode');
  if (!city) missing.push('city');
  if (!companyOrRole) missing.push('companyOrRole');
  if (!company) missing.push('company');
  if (!part) missing.push('part');
  if (missing.length > 0) {
    res.status(400).json({
      message: `Missing required fields: ${missing.join(', ')}`,
      code: ErrorCode.SHIPMENT_MISSING_FIELDS,
    });
    return;
  }

  try {
    const created = await shipmentsService.createShipment({
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
    handleError(res, err, 'Error creating shipment:');
  }
};

export const markSent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!validateObjectId(id, res)) return;

    const shipment = await shipmentsService.findShipmentDocument(id);
    if (!shipment) {
      res.status(404).json({
        message: 'Shipment not found',
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
    handleError(res, err, 'Error marking shipment sent:');
  }
};

export const deleteShipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!validateObjectId(id, res)) return;

    await shipmentsService.deleteShipmentById(id);
    res.status(200).json({ message: 'Deleted', code: ErrorCode.SHIPMENT_DELETED });
  } catch (err) {
    handleError(res, err, 'Error deleting shipment:');
  }
};

/**
 * Manually archive all current shipments (current month) into a PDF
 * stored in DB, then purge them. Admin / superadmin only.
 */
export const createArchive = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const archive = await shipmentsService.performArchiveForMonth(
      now.getFullYear(),
      now.getMonth(),
    );
    if (!archive) {
      res.status(400).json({
        message: 'No shipments to archive',
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
    handleError(res, err, 'Error creating shipment archive:');
  }
};

/**
 * List all archives (without the file buffer).
 */
export const getArchives = async (_req: Request, res: Response): Promise<void> => {
  try {
    const archives = await shipmentsService.listArchives();
    res.status(200).json(archives);
  } catch (err) {
    handleError(res, err, 'Error fetching archives:');
  }
};

/**
 * Download an archive file (PDF or XLSX).
 * Use ?format=xlsx to get an Excel file. Defaults to PDF.
 */
export const downloadArchive = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!validateObjectId(req.params.id as string, res)) return;

    const archive = await shipmentsService.findArchiveById(req.params.id as string);
    if (!archive) {
      res.status(404).json({ message: 'Archive not found', code: ErrorCode.ARCHIVE_NOT_FOUND });
      return;
    }

    const format = (req.query.format as string)?.toLowerCase();
    const safeTitle = archive.title.replace(/[^a-zA-Z0-9àâéèêëïîôùûüç\s-]/g, '');

    if (format === 'xlsx') {
      if (!archive.rawData || archive.rawData.length === 0) {
        res.status(400).json({
          message: 'XLSX data not available for this archive',
          code: ErrorCode.ARCHIVE_XLSX_UNAVAILABLE,
        });
        return;
      }
      const ws = XLSX.utils.json_to_sheet(archive.rawData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Envois');
      const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Length', xlsxBuffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="envois-${safeTitle}.xlsx"`);
      res.end(xlsxBuffer);
    } else {
      // Default: PDF - Mongoose lean() may return BSON Binary; ensure proper Buffer
      const raw = archive.fileBuffer;
      const pdfBuffer = Buffer.isBuffer(raw)
        ? raw
        : Buffer.from((raw as { buffer?: ArrayBuffer }).buffer ?? raw);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="envois-${safeTitle}.pdf"`);
      res.end(pdfBuffer);
    }
  } catch (err) {
    handleError(res, err, 'Error downloading archive:');
  }
};
