import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// #region Document sub-document
export type ClientFileDocType =
  'purchase_order' | 'report' | 'acceptance_report' | 'visit' | 'other';

export interface IClientFileDoc {
  _id: Types.ObjectId;
  name: string;
  filename: string;
  type: ClientFileDocType;
  uploadedAt: Date;
  uploadedBy?: string;
}
// #endregion

// #region Equipment sub-document
export interface IEquipement {
  cashguardCount: number;
  fusionCount: number;
  registerCount: number;
  otherEquipmentCount: number;
  scaleCount: number;
  tactisLicenses: number;
  innoLicenses: number;
  backofficePcCount: number;
  centralizationPcCount: number;
  allergenKiosk: boolean;
  orderKiosk: boolean;
  electronicLabels: boolean;
  loyaltyCard: boolean;
}
// #endregion

// #region Main interface
export interface IClientFile extends Document {
  // Identity
  company?: string;
  lastName: string;
  firstName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  legalStatus?: string;
  legalName?: string;
  storeName?: string;
  siret?: string;
  vatNumber?: string;
  nafCode?: string;
  // Planning
  closingDays?: string;
  preInstallationVisit: boolean;
  desiredInstallationDate?: string;
  desiredTrainingDate?: string;
  productFileEntry: boolean;
  carpentryPlanCutout: boolean;
  stoneworkPlanCutout: boolean;
  plannedOpening?: string;
  // Equipment
  equipment: IEquipement;
  // Remarks
  notes?: string;
  // Documents
  documents: IClientFileDoc[];
  // Link to existing contact (optional)
  contactRef?: Types.ObjectId;
  // Installation dates (filled in by the installer via the intervention report)
  dateInstallation?: Date;
  dateRenouvellement?: Date;
  // Meta
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
// #endregion

const equipementSchema = new Schema<IEquipement>(
  {
    cashguardCount: { type: Number, default: 0 },
    fusionCount: { type: Number, default: 0 },
    registerCount: { type: Number, default: 0 },
    otherEquipmentCount: { type: Number, default: 0 },
    scaleCount: { type: Number, default: 0 },
    tactisLicenses: { type: Number, default: 0 },
    innoLicenses: { type: Number, default: 0 },
    backofficePcCount: { type: Number, default: 0 },
    centralizationPcCount: { type: Number, default: 0 },
    allergenKiosk: { type: Boolean, default: false },
    orderKiosk: { type: Boolean, default: false },
    electronicLabels: { type: Boolean, default: false },
    loyaltyCard: { type: Boolean, default: false },
  },
  { _id: false },
);

const clientFileDocSchema = new Schema<IClientFileDoc>(
  {
    name: { type: String, required: true },
    filename: { type: String, required: true },
    type: {
      type: String,
      enum: ['purchase_order', 'report', 'acceptance_report', 'visit', 'other'],
      default: 'other',
    },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String },
  },
  { _id: true },
);

const clientFileSchema = new Schema<IClientFile>(
  {
    company: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    address: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    city: { type: String, trim: true },
    phone: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    legalStatus: { type: String, trim: true },
    legalName: { type: String, trim: true },
    storeName: { type: String, trim: true },
    siret: { type: String, trim: true },
    vatNumber: { type: String, trim: true },
    nafCode: { type: String, trim: true },
    closingDays: { type: String, trim: true },
    preInstallationVisit: { type: Boolean, default: false },
    desiredInstallationDate: { type: String, trim: true },
    desiredTrainingDate: { type: String, trim: true },
    productFileEntry: { type: Boolean, default: false },
    carpentryPlanCutout: { type: Boolean, default: false },
    stoneworkPlanCutout: { type: Boolean, default: false },
    plannedOpening: { type: String, trim: true },
    equipment: { type: equipementSchema, default: () => ({}) },
    notes: { type: String, trim: true },
    documents: { type: [clientFileDocSchema], default: [] },
    contactRef: { type: Schema.Types.ObjectId, ref: 'contact' },
    dateInstallation: { type: Date },
    dateRenouvellement: { type: Date },
    createdBy: { type: String },
  },
  { timestamps: true },
);

const ClientFileModel: Model<IClientFile> = mongoose.model<IClientFile>(
  'clientfile',
  clientFileSchema,
);

export default ClientFileModel;
