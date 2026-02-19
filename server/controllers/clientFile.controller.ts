import { Request, Response } from "express";
import ClientFileModel from "../models/clientFile.model";
import { validateObjectId } from "../utils/validate.utils";
import { logEvent } from "../utils/audit.utils";

// ─── List all client files ────────────────────────────────────────────────────
export const getClientFiles = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const files = await ClientFileModel.find()
      .sort({ createdAt: -1 })
      .populate("contactRef", "nom email tel")
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
      .populate("contactRef", "nom email tel")
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
    const file = await ClientFileModel.create(data);
    await logEvent(
      "create",
      "clientfile",
      file._id.toString(),
      res.locals.user?.pseudo,
      { entityName: `${file.nom} ${file.prenom ?? ""}`.trim() },
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
      "societe",
      "nom",
      "prenom",
      "adresse",
      "cp",
      "ville",
      "tel",
      "mobile",
      "email",
      "statutJuridique",
      "raisonSociale",
      "nomMagasin",
      "siret",
      "tvaIntra",
      "codeNaf",
      "joursFermeture",
      "visitePreinstallation",
      "dateInstallationSouhaitee",
      "dateFormationSouhaitee",
      "saisirFichierProduit",
      "decoupePlanMenuiserie",
      "decoupePlanMarbrerie",
      "ouverturePrevue",
      "equipement",
      "remarques",
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
      { entityName: `${file.nom} ${file.prenom ?? ""}`.trim() },
    );
    res.status(200).json({ message: "Fiche supprimée" });
  } catch (err) {
    console.error("Error deleting client file:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
