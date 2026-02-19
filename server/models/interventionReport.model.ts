import mongoose, { Document, Model, Schema, Types } from "mongoose";

// ─── CashGuard unit sub-document ─────────────────────────────────────────────
export interface ICashguardUnit {
  nSerie?: string;
  up?: string;
  ub?: string;
  k7Slots: [string, string, string, string]; // 4 cassette slots
  assignedCaisses: string[]; // e.g. ["CAISSE 1", "CAISSE 2"]
  hasPc: boolean;
}

// ─── Main interface ───────────────────────────────────────────────────────────
export interface IInterventionReport extends Document {
  clientFile: Types.ObjectId;
  // TW codes entered by tech préparateur
  twCaisse1?: string;
  twCaisse2?: string;
  twCaisse3?: string;
  twCaisses: string[]; // dynamic list, replaces fixed twCaisse1/2/3
  twPc?: string;
  // CashGuard units with serial numbers
  cashguardUnits: ICashguardUnit[];
  // General notes
  notes?: string;
  // Audit
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cashguardUnitSchema = new Schema<ICashguardUnit>(
  {
    nSerie: { type: String, trim: true },
    up: { type: String, trim: true },
    ub: { type: String, trim: true },
    k7Slots: {
      type: [String],
      default: ["", "", "", ""],
      validate: {
        validator: (v: string[]) => v.length === 4,
        message: "k7Slots must have exactly 4 entries",
      },
    },
    assignedCaisses: { type: [String], default: [] },
    hasPc: { type: Boolean, default: false },
  },
  { _id: false },
);

const interventionReportSchema = new Schema<IInterventionReport>(
  {
    clientFile: {
      type: Schema.Types.ObjectId,
      ref: "clientfile",
      required: true,
    },
    twCaisse1: { type: String, trim: true },
    twCaisse2: { type: String, trim: true },
    twCaisse3: { type: String, trim: true },
    twCaisses: { type: [String], default: [] },
    twPc: { type: String, trim: true },
    cashguardUnits: {
      type: [cashguardUnitSchema],
      default: [],
    },
    notes: { type: String, trim: true },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true },
);

const InterventionReportModel: Model<IInterventionReport> =
  mongoose.model<IInterventionReport>(
    "interventionreport",
    interventionReportSchema,
  );

export default InterventionReportModel;
