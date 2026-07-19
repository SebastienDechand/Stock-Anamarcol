import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import ClientFileModel from "../models/clientFile.model";
import type { ClientFileDocType } from "../models/clientFile.model";
import { validateObjectId } from "../utils/validate.utils";
import { logEvent } from "../utils/audit.utils";

// ─── Multer config for client file documents ───────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "client-files");

export const docUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "application/vnd.ms-excel", // xls
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else
      cb(
        new Error(
          "Type de fichier non supporté (PDF, image, XLS ou XLSX uniquement)",
        ),
      );
  },
});

// ─── List all client files ────────────────────────────────────────────────────
export const getClientFiles = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const files = await ClientFileModel.find()
      .sort({ createdAt: -1 })
      .populate("contactRef", "name email phone")
      .lean();
    res.status(200).json(files);
  } catch (err) {
    console.error("Error fetching client files:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// ─── Get one client file ──────────────────────────────────────────────────────
export const getClientFile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const file = await ClientFileModel.findById(req.params.id)
      .populate("contactRef", "name email phone")
      .lean();
    if (!file) {
      res.status(404).json({ message: "Fiche client introuvable" });
      return;
    }
    res.status(200).json(file);
  } catch (err) {
    console.error("Error fetching client file:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// ─── Create client file ───────────────────────────────────────────────────────
export const createClientFile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = { ...req.body, createdBy: res.locals.user?.pseudo };

    // ─── Duplicate check ─────────────────────────────────────────────────────
    // 1. SIRET + address (même enseigne, même boutique)
    if (data.siret?.trim() && data.address?.trim()) {
      const bySiretAddr = await ClientFileModel.findOne({
        siret: data.siret.trim(),
        address: { $regex: `^${data.address.trim()}$`, $options: "i" },
      }).lean();
      if (bySiretAddr) {
        res.status(409).json({
          message: "Une fiche client avec ce SIRET et cette adresse existe déjà",
          duplicate: { _id: bySiretAddr._id, lastName: bySiretAddr.lastName, company: bySiretAddr.company },
        });
        return;
      }
    }
    // 2. lastName + address
    if (data.lastName?.trim() && data.address?.trim()) {
      const byAddr = await ClientFileModel.findOne({
        lastName: { $regex: `^${data.lastName.trim()}$`, $options: "i" },
        address: { $regex: `^${data.address.trim()}$`, $options: "i" },
      }).lean();
      if (byAddr) {
        res.status(409).json({
          message: "Une fiche client avec ce nom et cette adresse existe déjà",
          duplicate: { _id: byAddr._id, lastName: byAddr.lastName, company: byAddr.company },
        });
        return;
      }
    }

    const file = await ClientFileModel.create(data);
    await logEvent(
      "create",
      "clientfile",
      file._id.toString(),
      res.locals.user?.pseudo,
      { entityName: `${file.lastName} ${file.firstName ?? ""}`.trim() },
    );
    res.status(201).json({ clientFile: file._id });
  } catch (err) {
    console.error("Error creating client file:", err);
    res.status(400).json({ message: "Erreur lors de la création de la fiche" });
  }
};

// ─── Update client file ───────────────────────────────────────────────────────
export const updateClientFile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const file = await ClientFileModel.findById(req.params.id);
    if (!file) {
      res.status(404).json({ message: "Fiche client introuvable" });
      return;
    }

    const updatableFields = [
      "company",
      "lastName",
      "firstName",
      "address",
      "postalCode",
      "city",
      "phone",
      "mobile",
      "email",
      "legalStatus",
      "legalName",
      "storeName",
      "siret",
      "vatNumber",
      "nafCode",
      "closingDays",
      "preInstallationVisit",
      "desiredInstallationDate",
      "desiredTrainingDate",
      "productFileEntry",
      "carpentryPlanCutout",
      "stoneworkPlanCutout",
      "plannedOpening",
      "equipment",
      "notes",
      "contactRef",
      "dateInstallation",
      "dateRenouvellement",
    ] as const;

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (file as any)[field] = req.body[field];
      }
    }

    const updated = await file.save();
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating client file:", err);
    res.status(400).json({ message: "Erreur lors de la mise à jour" });
  }
};

// ─── Delete client file ───────────────────────────────────────────────────────
export const deleteClientFile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const file = await ClientFileModel.findByIdAndDelete(req.params.id);
    if (!file) {
      res.status(404).json({ message: "Fiche client introuvable" });
      return;
    }
    await logEvent(
      "delete",
      "clientfile",
      req.params.id as string,
      res.locals.user?.pseudo,
      { entityName: `${file.lastName} ${file.firstName ?? ""}`.trim() },
    );
    res.status(200).json({ message: "Fiche supprimée" });
  } catch (err) {
    console.error("Error deleting client file:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// ─── Upload a document to a client file ───────────────────────────────────────
export const uploadDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;
  if (!req.file) {
    res.status(400).json({ message: "Aucun fichier fourni" });
    return;
  }

  try {
    const file = await ClientFileModel.findById(req.params.id);
    if (!file) {
      res.status(404).json({ message: "Fiche client introuvable" });
      return;
    }

    const docType: ClientFileDocType =
      (req.body.type as ClientFileDocType) || "other";

    file.documents.push({
      name: req.file.originalname,
      filename: req.file.filename,
      type: docType,
      uploadedAt: new Date(),
      uploadedBy: res.locals.user?.pseudo,
    } as never);

    const updated = await file.save();
    res.status(201).json(updated);
  } catch (err) {
    console.error("Error uploading document:", err);
    res.status(500).json({ message: "Erreur lors de l'upload" });
  }
};

// ─── Delete a document from a client file ─────────────────────────────────────
export const deleteDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;
  if (!validateObjectId(req.params.docId as string, res)) return;

  try {
    const file = await ClientFileModel.findById(req.params.id);
    if (!file) {
      res.status(404).json({ message: "Fiche client introuvable" });
      return;
    }

    const doc = file.documents.find(
      (d) => d._id.toString() === req.params.docId,
    );
    if (!doc) {
      res.status(404).json({ message: "Document introuvable" });
      return;
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, doc.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.warn("Could not delete file from disk:", filePath, err);
    });

    file.documents = file.documents.filter(
      (d) => d._id.toString() !== req.params.docId,
    ) as never;

    const updated = await file.save();
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};
