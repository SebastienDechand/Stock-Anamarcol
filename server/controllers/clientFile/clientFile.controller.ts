import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import type { ClientFileDocType } from '../../models/clientFile.model';
import * as clientFileService from '../../services/clientFile/clientFile.service';
import { validateObjectId } from '../../utils/validate/validate.utils';
import { logEvent } from '../../utils/audit/audit.utils';
import { handleError } from '../../utils/response/response.utils';
import { ErrorCode } from '../../constants/errorCodes';

// #region Multer config for client file documents
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'client-files');

export const docUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type (PDF, image, XLS or XLSX only)'));
  },
});
// #endregion

// #region List all client files
export const getClientFiles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const files = await clientFileService.listClientFiles();
    res.status(200).json(files);
  } catch (err) {
    handleError(res, err, 'Error fetching client files:');
  }
};
// #endregion

// #region Get one client file
export const getClientFile = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const file = await clientFileService.findClientFileById(req.params.id as string);
    if (!file) {
      res.status(404).json({
        message: 'Client file not found',
        code: ErrorCode.CLIENT_FILE_NOT_FOUND,
      });
      return;
    }
    res.status(200).json(file);
  } catch (err) {
    handleError(res, err, 'Error fetching client file:');
  }
};
// #endregion

// #region Create client file
export const createClientFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = { ...req.body, createdBy: res.locals.user?.username };

    // Duplicate check
    // 1. SIRET + address (same brand, same store)
    if (data.siret?.trim() && data.address?.trim()) {
      const bySiretAddr = await clientFileService.findClientFileBySiretAndAddress(
        data.siret.trim(),
        data.address.trim(),
      );
      if (bySiretAddr) {
        res.status(409).json({
          message: 'A client file with this SIRET and address already exists',
          code: ErrorCode.CLIENT_FILE_DUPLICATE_SIRET,
          duplicate: {
            _id: bySiretAddr._id,
            lastName: bySiretAddr.lastName,
            company: bySiretAddr.company,
          },
        });
        return;
      }
    }
    // 2. lastName + address
    if (data.lastName?.trim() && data.address?.trim()) {
      const byAddr = await clientFileService.findClientFileByNameAndAddress(
        data.lastName.trim(),
        data.address.trim(),
      );
      if (byAddr) {
        res.status(409).json({
          message: 'A client file with this name and address already exists',
          code: ErrorCode.CLIENT_FILE_DUPLICATE_NAME,
          duplicate: { _id: byAddr._id, lastName: byAddr.lastName, company: byAddr.company },
        });
        return;
      }
    }

    const file = await clientFileService.createClientFile(data);
    await logEvent('create', 'clientfile', file._id.toString(), res.locals.user?.username, {
      entityName: `${file.lastName} ${file.firstName ?? ''}`.trim(),
    });
    res.status(201).json({ clientFile: file._id });
  } catch (err) {
    console.error('Error creating client file:', err);
    res.status(400).json({
      message: 'Error creating client file',
      code: ErrorCode.CLIENT_FILE_CREATE_ERROR,
    });
  }
};
// #endregion

// #region Update client file
export const updateClientFile = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const file = await clientFileService.findClientFileDocument(req.params.id as string);
    if (!file) {
      res.status(404).json({
        message: 'Client file not found',
        code: ErrorCode.CLIENT_FILE_NOT_FOUND,
      });
      return;
    }

    const updatableFields = [
      'company',
      'lastName',
      'firstName',
      'address',
      'postalCode',
      'city',
      'phone',
      'mobile',
      'email',
      'legalStatus',
      'legalName',
      'storeName',
      'siret',
      'vatNumber',
      'nafCode',
      'closingDays',
      'preInstallationVisit',
      'desiredInstallationDate',
      'desiredTrainingDate',
      'productFileEntry',
      'carpentryPlanCutout',
      'stoneworkPlanCutout',
      'plannedOpening',
      'equipment',
      'notes',
      'contactRef',
      'dateInstallation',
      'dateRenouvellement',
    ] as const;

    const mutableFile = file as unknown as Record<string, unknown>;
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        mutableFile[field] = req.body[field];
      }
    }

    const updated = await file.save();
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating client file:', err);
    res.status(400).json({
      message: 'Error updating client file',
      code: ErrorCode.CLIENT_FILE_UPDATE_ERROR,
    });
  }
};
// #endregion

// #region Delete client file
export const deleteClientFile = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const file = await clientFileService.deleteClientFileById(req.params.id as string);
    if (!file) {
      res.status(404).json({
        message: 'Client file not found',
        code: ErrorCode.CLIENT_FILE_NOT_FOUND,
      });
      return;
    }
    await logEvent('delete', 'clientfile', req.params.id as string, res.locals.user?.username, {
      entityName: `${file.lastName} ${file.firstName ?? ''}`.trim(),
    });
    res.status(200).json({
      message: 'Client file deleted',
      code: ErrorCode.CLIENT_FILE_DELETED,
    });
  } catch (err) {
    handleError(res, err, 'Error deleting client file:');
  }
};
// #endregion

// #region Upload a document to a client file
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;
  if (!req.file) {
    res.status(400).json({ message: 'No file provided', code: ErrorCode.NO_FILE_PROVIDED });
    return;
  }

  try {
    const file = await clientFileService.findClientFileDocument(req.params.id as string);
    if (!file) {
      res.status(404).json({
        message: 'Client file not found',
        code: ErrorCode.CLIENT_FILE_NOT_FOUND,
      });
      return;
    }

    const docType: ClientFileDocType = (req.body.type as ClientFileDocType) || 'other';

    file.documents.push({
      name: req.file.originalname,
      filename: req.file.filename,
      type: docType,
      uploadedAt: new Date(),
      uploadedBy: res.locals.user?.username,
    } as never);

    const updated = await file.save();
    res.status(201).json(updated);
  } catch (err) {
    handleError(
      res,
      err,
      'Error uploading document:',
      'Error uploading document',
      ErrorCode.CLIENT_FILE_UPLOAD_ERROR,
    );
  }
};
// #endregion

// #region Delete a document from a client file
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;
  if (!validateObjectId(req.params.docId as string, res)) return;

  try {
    const file = await clientFileService.findClientFileDocument(req.params.id as string);
    if (!file) {
      res.status(404).json({
        message: 'Client file not found',
        code: ErrorCode.CLIENT_FILE_NOT_FOUND,
      });
      return;
    }

    const doc = file.documents.find((d) => d._id.toString() === req.params.docId);
    if (!doc) {
      res.status(404).json({ message: 'Document not found', code: ErrorCode.DOCUMENT_NOT_FOUND });
      return;
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, doc.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.warn('Could not delete file from disk:', filePath, err);
    });

    file.documents = file.documents.filter((d) => d._id.toString() !== req.params.docId) as never;

    const updated = await file.save();
    res.status(200).json(updated);
  } catch (err) {
    handleError(
      res,
      err,
      'Error deleting document:',
      'Error deleting document',
      ErrorCode.DOCUMENT_DELETE_ERROR,
    );
  }
};
// #endregion
