import { Request, Response } from "express";
import VehicleModel, { IVehicle } from "../models/vehicle.model";
import UserModel from "../models/user.model";
import { logEvent } from "../utils/audit.utils";

// ─── GET All Vehicles ────────────────────────────────
export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await VehicleModel.find()
      .populate("assignedTo", "pseudo email poste")
      .sort({ createdAt: -1 });

    res.status(200).json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Error fetching vehicles" });
  }
};

// ─── GET Vehicle by ID ───────────────────────────────
export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await VehicleModel.findById(id).populate(
      "assignedTo",
      "pseudo email poste",
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Error fetching vehicle" });
  }
};

// ─── CREATE Vehicle ──────────────────────────────────
export const createVehicle = async (req: Request, res: Response) => {
  try {
    const {
      marque,
      modele,
      format,
      immatriculation,
      dateRevision,
      dateCtInspection,
      dateCtExpiration,
      dateControlAntiPollutionInspection,
      dateControlAntiPollutionExpiration,
      assignedTo,
      notes,
    } = req.body;

    // Validate required fields
    if (!marque || !modele || !format || !immatriculation) {
      return res.status(400).json({
        message:
          "Missing required fields: marque, modele, format, immatriculation",
      });
    }

    // Check if immatriculation already exists
    const existingVehicle = await VehicleModel.findOne({
      immatriculation: immatriculation.toUpperCase(),
    });
    if (existingVehicle) {
      return res.status(400).json({
        message: "Vehicle with this immatriculation already exists",
      });
    }

    // Validate brand-model combination
    if (marque === "mercedes" && !["citan", "vito"].includes(modele)) {
      return res.status(400).json({
        message: "Mercedes vehicles must be Citan or Vito",
      });
    }
    if (marque === "nissan" && modele !== "navara") {
      return res.status(400).json({
        message: "Nissan vehicles must be Navara",
      });
    }

    // Get assigned user name if provided
    let assignedToName = undefined;
    if (assignedTo) {
      const user = await UserModel.findById(assignedTo);
      if (!user) {
        return res.status(404).json({ message: "Assigned user not found" });
      }
      assignedToName = user.pseudo;
    }

    const newVehicle = new VehicleModel({
      marque,
      modele,
      format,
      immatriculation: immatriculation.toUpperCase(),
      dateRevision: dateRevision ? new Date(dateRevision) : undefined,
      dateCtInspection: dateCtInspection ? new Date(dateCtInspection) : undefined,
      dateCtExpiration: dateCtExpiration ? new Date(dateCtExpiration) : undefined,
      dateControlAntiPollutionInspection: dateControlAntiPollutionInspection ? new Date(dateControlAntiPollutionInspection) : undefined,
      dateControlAntiPollutionExpiration: dateControlAntiPollutionExpiration ? new Date(dateControlAntiPollutionExpiration) : undefined,
      assignedTo: assignedTo || undefined,
      assignedToName,
      notes,
      createdBy: res.locals.user?.pseudo || "System",
    });

    await newVehicle.save();
    await logEvent(
      "create",
      "vehicle",
      newVehicle._id.toString(),
      res.locals.user?.pseudo,
      {
        marque,
        modele,
        immatriculation,
      },
    );

    res.status(201).json(newVehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ message: "Error creating vehicle" });
  }
};

// ─── UPDATE Vehicle ──────────────────────────────────
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      marque,
      modele,
      format,
      immatriculation,
      dateRevision,
      dateCtInspection,
      dateCtExpiration,
      dateControlAntiPollutionInspection,
      dateControlAntiPollutionExpiration,
      assignedTo,
      notes,
    } = req.body;

    const vehicle = await VehicleModel.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check immatriculation uniqueness if changed
    if (immatriculation && immatriculation !== vehicle.immatriculation) {
      const existing = await VehicleModel.findOne({
        immatriculation: immatriculation.toUpperCase(),
        _id: { $ne: new (require("mongoose").Types.ObjectId)(id) },
      } as any);
      if (existing) {
        return res.status(400).json({
          message: "Vehicle with this immatriculation already exists",
        });
      }
    }

    // Validate brand-model combination if provided
    if (marque && modele) {
      if (marque === "mercedes" && !["citan", "vito"].includes(modele)) {
        return res.status(400).json({
          message: "Mercedes vehicles must be Citan or Vito",
        });
      }
      if (marque === "nissan" && modele !== "navara") {
        return res.status(400).json({
          message: "Nissan vehicles must be Navara",
        });
      }
    }

    // Get assigned user name if provided
    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === "") {
        vehicle.assignedTo = undefined;
        vehicle.assignedToName = undefined;
      } else {
        const user = await UserModel.findById(assignedTo);
        if (!user) {
          return res.status(404).json({ message: "Assigned user not found" });
        }
        vehicle.assignedTo = assignedTo;
        vehicle.assignedToName = user.pseudo;
      }
    }

    // Update fields
    if (marque) vehicle.marque = marque;
    if (modele) vehicle.modele = modele;
    if (format) vehicle.format = format;
    if (immatriculation)
      vehicle.immatriculation = immatriculation.toUpperCase();
    if (dateRevision) vehicle.dateRevision = new Date(dateRevision);
    if (dateCtInspection) vehicle.dateCtInspection = new Date(dateCtInspection);
    if (dateCtExpiration) vehicle.dateCtExpiration = new Date(dateCtExpiration);
    if (dateControlAntiPollutionInspection) vehicle.dateControlAntiPollutionInspection = new Date(dateControlAntiPollutionInspection);
    if (dateControlAntiPollutionExpiration) vehicle.dateControlAntiPollutionExpiration = new Date(dateControlAntiPollutionExpiration);
    if (notes !== undefined) vehicle.notes = notes;

    await vehicle.save();
    await logEvent("update", "vehicle", id as string, res.locals.user?.pseudo, {
      updatedFields: { marque, modele, format, immatriculation },
    });

    const updated = await vehicle.populate("assignedTo", "pseudo email poste");
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Error updating vehicle" });
  }
};

// ─── DELETE Vehicle ──────────────────────────────────
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await VehicleModel.findByIdAndDelete(id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    await logEvent("delete", "vehicle", id as string, res.locals.user?.pseudo, {
      immatriculation: vehicle.immatriculation,
    });

    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Error deleting vehicle" });
  }
};

// ─── SEARCH Vehicles ─────────────────────────────────
export const searchVehicles = async (req: Request, res: Response) => {
  try {
    const { q, marque, modele, assignedTo } = req.query;

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { immatriculation: { $regex: q, $options: "i" } },
        { assignedToName: { $regex: q, $options: "i" } },
      ];
    }

    if (marque) filter.marque = marque;
    if (modele) filter.modele = modele;
    if (assignedTo) filter.assignedTo = assignedTo;

    const vehicles = await VehicleModel.find(filter)
      .populate("assignedTo", "pseudo email poste")
      .sort({ createdAt: -1 });

    res.status(200).json(vehicles);
  } catch (error) {
    console.error("Error searching vehicles:", error);
    res.status(500).json({ message: "Error searching vehicles" });
  }
};

// ─── UPLOAD Document ─────────────────────────────────
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { docType, docName } = req.body;
    const file = req.file;

    if (!file || !docType) {
      return res.status(400).json({ message: "File and docType are required" });
    }

    const vehicle = await VehicleModel.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const doc = {
      _id: new (require("mongoose").Types.ObjectId)(),
      name: docName || file.originalname,
      filename: file.filename,
      type: docType,
      uploadedAt: new Date(),
      uploadedBy: res.locals.user?.pseudo,
    };

    vehicle.documents.push(doc);
    await vehicle.save();

    await logEvent(
      "upload_document",
      "vehicle",
      id as string,
      res.locals.user?.pseudo,
      {
        docType,
        filename: file.filename,
      },
    );

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Error uploading document" });
  }
};

// ─── DELETE Document ─────────────────────────────────
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id, docId } = req.params;

    const vehicle = await VehicleModel.findByIdAndUpdate(
      id,
      { $pull: { documents: { _id: docId } } },
      { new: true },
    ).populate("assignedTo", "pseudo email poste");

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    await logEvent(
      "delete_document",
      "vehicle",
      id as string,
      res.locals.user?.pseudo,
      {
        docId,
      },
    );

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Error deleting document" });
  }
};
