import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// #region CashGuard unit sub-document
export interface ICashguardUnit {
  serialNumber?: string;
  up?: string;
  ub?: string;
  cassetteSlots: [string, string, string, string]; // 4 cassette slots
  assignedRegisters: string[]; // e.g. ["CAISSE 1", "CAISSE 2"]
  hasPc: boolean;
}
// #endregion

// #region Main interface
export interface IInterventionReport extends Document {
  clientFile: Types.ObjectId;
  // TW codes entered by the prep technician
  twRegister1?: string;
  twRegister2?: string;
  twRegister3?: string;
  twRegisters: string[]; // dynamic list, replaces fixed twRegister1/2/3
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
// #endregion

const cashguardUnitSchema = new Schema<ICashguardUnit>(
  {
    serialNumber: { type: String, trim: true },
    up: { type: String, trim: true },
    ub: { type: String, trim: true },
    cassetteSlots: {
      type: [String],
      default: ['', '', '', ''],
      validate: {
        validator: (v: string[]) => v.length === 4,
        message: 'cassetteSlots must have exactly 4 entries',
      },
    },
    assignedRegisters: { type: [String], default: [] },
    hasPc: { type: Boolean, default: false },
  },
  { _id: false },
);

const interventionReportSchema = new Schema<IInterventionReport>(
  {
    clientFile: {
      type: Schema.Types.ObjectId,
      ref: 'clientfile',
      required: true,
    },
    twRegister1: { type: String, trim: true },
    twRegister2: { type: String, trim: true },
    twRegister3: { type: String, trim: true },
    twRegisters: { type: [String], default: [] },
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

const InterventionReportModel: Model<IInterventionReport> = mongoose.model<IInterventionReport>(
  'interventionreport',
  interventionReportSchema,
);

export default InterventionReportModel;
