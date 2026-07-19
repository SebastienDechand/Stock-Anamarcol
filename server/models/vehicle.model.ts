import mongoose, { Document, Model, Schema, Types } from "mongoose";

// ─── Document sub-document pour factures et documents ──
export interface IVehicleDoc {
  _id: Types.ObjectId;
  name: string;
  filename: string;
  type: "service_invoice" | "inspection" | "anti_pollution" | "other";
  uploadedAt: Date;
  uploadedBy?: string;
}

// ─── Main interface ───────────────────────────────────
// `Omit<Document, "model">` avoids a naming collision with Mongoose's own
// `Document.model()` method, which our `model` field would otherwise clash
// with (Document, unlike Schema, uses "model" as a reserved instance method).
export interface IVehicle extends Omit<Document, "model"> {
  // Identification
  brand: "mercedes" | "nissan";
  model: "citan" | "vito" | "navara";
  format: "van" | "pickup" | "truck";
  licensePlate: string;

  // Maintenance
  serviceDate?: Date;
  inspectionDate?: Date;
  inspectionExpiryDate?: Date;
  antiPollutionInspectionDate?: Date;
  antiPollutionExpiryDate?: Date;

  // Assignment
  assignedTo?: any;
  assignedToName?: string;

  // Documents
  documents: IVehicleDoc[];
  notes?: string;

  // Meta
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────
const vehicleDocSchema = new Schema<IVehicleDoc>(
  {
    name: { type: String, required: true },
    filename: { type: String, required: true },
    type: {
      type: String,
      enum: ["service_invoice", "inspection", "anti_pollution", "other"],
      default: "other",
    },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String },
  },
  { _id: true },
);

const vehicleSchema = new Schema<IVehicle>(
  {
    brand: {
      type: String,
      enum: ["mercedes", "nissan"],
      required: true,
      index: true,
    },
    model: {
      type: String,
      enum: ["citan", "vito", "navara"],
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: ["van", "pickup", "truck"],
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    serviceDate: { type: Date },
    inspectionDate: { type: Date },
    inspectionExpiryDate: { type: Date },
    antiPollutionInspectionDate: { type: Date },
    antiPollutionExpiryDate: { type: Date },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    assignedToName: { type: String },
    notes: { type: String, trim: true },
    documents: { type: [vehicleDocSchema], default: [] },
    createdBy: { type: String },
  },
  { timestamps: true },
);

// Indexes
vehicleSchema.index({ brand: 1, model: 1 });
vehicleSchema.index({ assignedTo: 1 });
vehicleSchema.index({ createdAt: -1 });

const VehicleModel: Model<IVehicle> = mongoose.model<IVehicle>(
  "vehicle",
  vehicleSchema,
);

// Drop legacy index left over from when the field was named "immatriculation"
VehicleModel.collection.dropIndex("immatriculation_1").catch(() => {
  // Index doesn't exist — nothing to do
});

export default VehicleModel;
