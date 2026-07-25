import { Request, Response } from "express";
import { Types } from "mongoose";
import * as vehicleService from "../services/vehicle.service";
import { logEvent } from "../utils/audit.utils";
import { validateObjectId } from "../utils/validate.utils";
import { handleError } from "../utils/response.utils";
import { ErrorCode } from "../constants/errorCodes";

// #region GET All Vehicles
export const getAllVehicles = async (_req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.listVehicles();

    res.status(200).json(vehicles);
  } catch (error) {
    handleError(
      res,
      error,
      "Error fetching vehicles:",
      "Error fetching vehicles",
      ErrorCode.VEHICLE_FETCH_ERROR,
    );
  }
};
// #endregion

// #region GET Vehicle by ID
export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id as string, res)) return;

    const vehicle = await vehicleService.findVehicleById(id as string);

    if (!vehicle) {
      return res
        .status(404)
        .json({ message: "Vehicle not found", code: ErrorCode.VEHICLE_NOT_FOUND });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    handleError(
      res,
      error,
      "Error fetching vehicle:",
      "Error fetching vehicle",
      ErrorCode.VEHICLE_FETCH_ERROR,
    );
  }
};
// #endregion

// #region CREATE Vehicle
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
        code: ErrorCode.VEHICLE_MISSING_FIELDS,
      });
    }

    // Check if licensePlate already exists
    const existingVehicle = await vehicleService.findVehicleByLicensePlate(licensePlate);
    if (existingVehicle) {
      return res.status(400).json({
        message: "Vehicle with this licensePlate already exists",
        code: ErrorCode.VEHICLE_LICENSE_PLATE_DUPLICATE,
      });
    }

    // Validate brand-model combination
    if (brand === "mercedes" && !["citan", "vito"].includes(model)) {
      return res.status(400).json({
        message: "Mercedes vehicles must be Citan or Vito",
        code: ErrorCode.VEHICLE_INVALID_MERCEDES_MODEL,
      });
    }
    if (brand === "nissan" && model !== "navara") {
      return res.status(400).json({
        message: "Nissan vehicles must be Navara",
        code: ErrorCode.VEHICLE_INVALID_NISSAN_MODEL,
      });
    }

    // Get assigned user name if provided
    let assignedToName = undefined;
    if (assignedTo) {
      const user = await vehicleService.findAssignedUser(assignedTo);
      if (!user) {
        return res.status(404).json({
          message: "Assigned user not found",
          code: ErrorCode.VEHICLE_ASSIGNED_USER_NOT_FOUND,
        });
      }
      assignedToName = user.username;
    }

    const newVehicle = await vehicleService.createVehicle({
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
    handleError(
      res,
      error,
      "Error creating vehicle:",
      "Error creating vehicle",
      ErrorCode.VEHICLE_CREATE_ERROR,
    );
  }
};
// #endregion

// #region UPDATE Vehicle
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id as string, res)) return;

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

    const vehicle = await vehicleService.findVehicleDocument(id as string);
    if (!vehicle) {
      return res
        .status(404)
        .json({ message: "Vehicle not found", code: ErrorCode.VEHICLE_NOT_FOUND });
    }

    // Check licensePlate uniqueness if changed
    if (licensePlate && licensePlate !== vehicle.licensePlate) {
      const existing = await vehicleService.findOtherVehicleByLicensePlate(
        licensePlate,
        id as string,
      );
      if (existing) {
        return res.status(400).json({
          message: "Vehicle with this licensePlate already exists",
          code: ErrorCode.VEHICLE_LICENSE_PLATE_DUPLICATE,
        });
      }
    }

    // Validate brand-model combination if provided
    if (brand && model) {
      if (brand === "mercedes" && !["citan", "vito"].includes(model)) {
        return res.status(400).json({
          message: "Mercedes vehicles must be Citan or Vito",
          code: ErrorCode.VEHICLE_INVALID_MERCEDES_MODEL,
        });
      }
      if (brand === "nissan" && model !== "navara") {
        return res.status(400).json({
          message: "Nissan vehicles must be Navara",
          code: ErrorCode.VEHICLE_INVALID_NISSAN_MODEL,
        });
      }
    }

    // Get assigned user name if provided
    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === "") {
        vehicle.assignedTo = undefined;
        vehicle.assignedToName = undefined;
      } else {
        const user = await vehicleService.findAssignedUser(assignedTo);
        if (!user) {
          return res.status(404).json({
            message: "Assigned user not found",
            code: ErrorCode.VEHICLE_ASSIGNED_USER_NOT_FOUND,
          });
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
    handleError(
      res,
      error,
      "Error updating vehicle:",
      "Error updating vehicle",
      ErrorCode.VEHICLE_UPDATE_ERROR,
    );
  }
};
// #endregion

// #region DELETE Vehicle
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id as string, res)) return;

    const vehicle = await vehicleService.deleteVehicleById(id as string);

    if (!vehicle) {
      return res
        .status(404)
        .json({ message: "Vehicle not found", code: ErrorCode.VEHICLE_NOT_FOUND });
    }

    await logEvent("delete", "vehicle", id as string, res.locals.user?.username, {
      licensePlate: vehicle.licensePlate,
    });

    res
      .status(200)
      .json({ message: "Vehicle deleted successfully", code: ErrorCode.VEHICLE_DELETED });
  } catch (error) {
    handleError(
      res,
      error,
      "Error deleting vehicle:",
      "Error deleting vehicle",
      ErrorCode.VEHICLE_DELETE_ERROR,
    );
  }
};
// #endregion

// #region SEARCH Vehicles
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

    const vehicles = await vehicleService.searchVehicles(filter);

    res.status(200).json(vehicles);
  } catch (error) {
    handleError(
      res,
      error,
      "Error searching vehicles:",
      "Error searching vehicles",
      ErrorCode.VEHICLE_SEARCH_ERROR,
    );
  }
};
// #endregion

// #region UPLOAD Document
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id as string, res)) return;

    const { docType, docName } = req.body;
    const file = req.file;

    if (!file || !docType) {
      return res.status(400).json({
        message: "File and docType are required",
        code: ErrorCode.VEHICLE_DOC_MISSING_FIELDS,
      });
    }

    const vehicle = await vehicleService.findVehicleDocument(id as string);
    if (!vehicle) {
      return res
        .status(404)
        .json({ message: "Vehicle not found", code: ErrorCode.VEHICLE_NOT_FOUND });
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
    handleError(
      res,
      error,
      "Error uploading document:",
      "Error uploading document",
      ErrorCode.VEHICLE_DOC_UPLOAD_ERROR,
    );
  }
};
// #endregion

// #region DELETE Document
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id, docId } = req.params;
    if (!validateObjectId(id as string, res) || !validateObjectId(docId as string, res))
      return;

    const vehicle = await vehicleService.pullVehicleDocument(id as string, docId as string);

    if (!vehicle) {
      return res
        .status(404)
        .json({ message: "Vehicle not found", code: ErrorCode.VEHICLE_NOT_FOUND });
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
    handleError(
      res,
      error,
      "Error deleting document:",
      "Error deleting document",
      ErrorCode.VEHICLE_DOC_DELETE_ERROR,
    );
  }
};
// #endregion
