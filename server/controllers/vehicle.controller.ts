import { Request, Response } from "express";
import { Types } from "mongoose";
import VehicleModel from "../models/vehicle.model";
import UserModel from "../models/user.model";
import { logEvent } from "../utils/audit.utils";

// ─── GET All Vehicles ────────────────────────────────
export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await VehicleModel.find()
      .populate("assignedTo", "username email position")
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
      "username email position",
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
      brand,
      model,
      format,
      licensePlate,
      serviceDate,
      inspectionDate,
      inspectionExpiryDate,
      antiPollutionInspectionDate,
      antiPollutionExpiryDate,
      assignedTo,
      notes,
    } = req.body;

    // Validate required fields
    if (!brand || !model || !format || !licensePlate) {
      return res.status(400).json({
        message:
          "Missing required fields: brand, model, format, licensePlate",
      });
    }

    // Check if licensePlate already exists
    const existingVehicle = await VehicleModel.findOne({
      licensePlate: licensePlate.toUpperCase(),
    });
    if (existingVehicle) {
      return res.status(400).json({
        message: "Vehicle with this licensePlate already exists",
      });
    }

    // Validate brand-model combination
    if (brand === "mercedes" && !["citan", "vito"].includes(model)) {
      return res.status(400).json({
        message: "Mercedes vehicles must be Citan or Vito",
      });
    }
    if (brand === "nissan" && model !== "navara") {
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
      assignedToName = user.username;
    }

    const newVehicle = new VehicleModel({
      brand,
      model,
      format,
      licensePlate: licensePlate.toUpperCase(),
      serviceDate: serviceDate ? new Date(serviceDate) : undefined,
      inspectionDate: inspectionDate ? new Date(inspectionDate) : undefined,
      inspectionExpiryDate: inspectionExpiryDate ? new Date(inspectionExpiryDate) : undefined,
      antiPollutionInspectionDate: antiPollutionInspectionDate ? new Date(antiPollutionInspectionDate) : undefined,
      antiPollutionExpiryDate: antiPollutionExpiryDate ? new Date(antiPollutionExpiryDate) : undefined,
      assignedTo: assignedTo || undefined,
      assignedToName,
      notes,
      createdBy: res.locals.user?.username || "System",
    });

    await newVehicle.save();
    await logEvent(
      "create",
      "vehicle",
      newVehicle._id.toString(),
      res.locals.user?.username,
      {
        brand,
        model,
        licensePlate,
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
      brand,
      model,
      format,
      licensePlate,
      serviceDate,
      inspectionDate,
      inspectionExpiryDate,
      antiPollutionInspectionDate,
      antiPollutionExpiryDate,
      assignedTo,
      notes,
    } = req.body;

    const vehicle = await VehicleModel.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check licensePlate uniqueness if changed
    if (licensePlate && licensePlate !== vehicle.licensePlate) {
      const existing = await VehicleModel.findOne({
        licensePlate: licensePlate.toUpperCase(),
        _id: { $ne: new Types.ObjectId(id as string) },
      } as Record<string, unknown>);
      if (existing) {
        return res.status(400).json({
          message: "Vehicle with this licensePlate already exists",
        });
      }
    }

    // Validate brand-model combination if provided
    if (brand && model) {
      if (brand === "mercedes" && !["citan", "vito"].includes(model)) {
        return res.status(400).json({
          message: "Mercedes vehicles must be Citan or Vito",
        });
      }
      if (brand === "nissan" && model !== "navara") {
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
        vehicle.assignedToName = user.username;
      }
    }

    // Update fields
    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;
    if (format) vehicle.format = format;
    if (licensePlate)
      vehicle.licensePlate = licensePlate.toUpperCase();
    if (serviceDate) vehicle.serviceDate = new Date(serviceDate);
    if (inspectionDate) vehicle.inspectionDate = new Date(inspectionDate);
    if (inspectionExpiryDate) vehicle.inspectionExpiryDate = new Date(inspectionExpiryDate);
    if (antiPollutionInspectionDate) vehicle.antiPollutionInspectionDate = new Date(antiPollutionInspectionDate);
    if (antiPollutionExpiryDate) vehicle.antiPollutionExpiryDate = new Date(antiPollutionExpiryDate);
    if (notes !== undefined) vehicle.notes = notes;

    await vehicle.save();
    await logEvent("update", "vehicle", id as string, res.locals.user?.username, {
      updatedFields: { brand, model, format, licensePlate },
    });

    const updated = await vehicle.populate("assignedTo", "username email position");
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

    await logEvent("delete", "vehicle", id as string, res.locals.user?.username, {
      licensePlate: vehicle.licensePlate,
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
    const { q, brand, model, assignedTo } = req.query;

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { licensePlate: { $regex: q, $options: "i" } },
        { assignedToName: { $regex: q, $options: "i" } },
      ];
    }

    if (brand) filter.brand = brand;
    if (model) filter.model = model;
    if (assignedTo) filter.assignedTo = assignedTo;

    const vehicles = await VehicleModel.find(filter)
      .populate("assignedTo", "username email position")
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
      _id: new Types.ObjectId(),
      name: docName || file.originalname,
      filename: file.filename,
      type: docType,
      uploadedAt: new Date(),
      uploadedBy: res.locals.user?.username,
    };

    vehicle.documents.push(doc);
    await vehicle.save();

    await logEvent(
      "upload_document",
      "vehicle",
      id as string,
      res.locals.user?.username,
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
    ).populate("assignedTo", "username email position");

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    await logEvent(
      "delete_document",
      "vehicle",
      id as string,
      res.locals.user?.username,
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
