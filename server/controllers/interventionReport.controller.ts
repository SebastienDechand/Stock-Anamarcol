import { Request, Response } from "express";
import InterventionReportModel from "../models/interventionReport.model";
import { validateObjectId } from "../utils/validate.utils";

// ─── List all reports (optionally filter by clientFile) ───────────────────────
export const getInterventionReports = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const filter = req.query.clientFileId
      ? { clientFile: req.query.clientFileId }
      : {};
    const reports = await InterventionReportModel.find(filter)
      .sort({ createdAt: -1 })
      .populate("clientFile", "lastName firstName company postalCode city")
      .lean();
    res.status(200).json(reports);
  } catch (err) {
    console.error("Error fetching intervention reports:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// ─── Get one report ───────────────────────────────────────────────────────────
export const getInterventionReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const report = await InterventionReportModel.findById(req.params.id)
      .populate("clientFile", "lastName firstName company postalCode city")
      .lean();
    if (!report) {
      res.status(404).json({ message: "Rapport introuvable" });
      return;
    }
    res.status(200).json(report);
  } catch (err) {
    console.error("Error fetching intervention report:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// ─── Create report ────────────────────────────────────────────────────────────
export const createInterventionReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = { ...req.body, createdBy: res.locals.user?.pseudo };
    const report = await InterventionReportModel.create(data);
    res.status(201).json({ interventionReport: report._id });
  } catch (err) {
    console.error("Error creating intervention report:", err);
    res.status(400).json({ message: "Erreur lors de la création du rapport" });
  }
};

// ─── Update report ────────────────────────────────────────────────────────────
export const updateInterventionReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const report = await InterventionReportModel.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: "Rapport introuvable" });
      return;
    }

    const fields = [
      "twCaisse1",
      "twCaisse2",
      "twCaisse3",
      "twCaisses",
      "twPc",
      "cashguardUnits",
      "notes",
    ] as const;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (report as any)[field] = req.body[field];
      }
    }
    report.updatedBy = res.locals.user?.pseudo;

    const updated = await report.save();
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating intervention report:", err);
    res.status(400).json({ message: "Erreur lors de la mise à jour" });
  }
};

// ─── Delete report ────────────────────────────────────────────────────────────
export const deleteInterventionReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const report = await InterventionReportModel.findByIdAndDelete(
      req.params.id,
    );
    if (!report) {
      res.status(404).json({ message: "Rapport introuvable" });
      return;
    }
    res.status(200).json({ message: "Rapport supprimé" });
  } catch (err) {
    console.error("Error deleting intervention report:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
