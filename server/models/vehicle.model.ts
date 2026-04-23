import mongoose, { Document, Model, Schema, Types } from "mongoose";

// ─── Document sub-document pour factures et documents ──
export interface IVehicleDoc {
  _id: Types.ObjectId;
  name: string;
  filename: string;
  type: "facture_revision" | "ct" | "anti_pollution" | "autre";
  uploadedAt: Date;
  uploadedBy?: string;
}

// ─── Main interface ───────────────────────────────────
export interface IVehicle extends Document {
  // Identification
  marque: "mercedes" | "nissan";
  modele: "citan" | "vito" | "navara";
  format: "utilitaire" | "pickup" | "camion";
  immatriculation: string;

  // Maintenance
  dateRevision?: Date;
  dateCtInspection?: Date;
  dateCtExpiration?: Date;
  dateControlAntiPollutionInspection?: Date;
  dateControlAntiPollutionExpiration?: Date;

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
      enum: ["facture_revision", "ct", "anti_pollution", "autre"],
      default: "autre",
    },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String },
  },
  { _id: true },
);

const vehicleSchema = new Schema<IVehicle>(
  {
    marque: {
      type: String,
      enum: ["mercedes", "nissan"],
      required: true,
      index: true,
    },
    modele: {
      type: String,
      enum: ["citan", "vito", "navara"],
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: ["utilitaire", "pickup", "camion"],
      required: true,
    },
    immatriculation: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    dateRevision: { type: Date },
    dateCtInspection: { type: Date },
    dateCtExpiration: { type: Date },
    dateControlAntiPollutionInspection: { type: Date },
    dateControlAntiPollutionExpiration: { type: Date },
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
vehicleSchema.index({ marque: 1, modele: 1 });
vehicleSchema.index({ assignedTo: 1 });
vehicleSchema.index({ createdAt: -1 });

const VehicleModel: Model<IVehicle> = mongoose.model<IVehicle>(
  "vehicle",
  vehicleSchema,
);

// Drop legacy index left over from when the field was named "licensePlate"
VehicleModel.collection.dropIndex("licensePlate_1").catch(() => {
  // Index doesn't exist — nothing to do
});

export default VehicleModel;
