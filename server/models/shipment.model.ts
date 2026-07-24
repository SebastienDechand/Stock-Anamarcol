import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IShipment extends Document {
  // #region Client card
  lastName: string;
  firstName: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address: string;
  postalCode: string;
  city: string;
  companyOrRole: string;
  company: string;
  // #endregion
  // #region Shipment
  part: string;
  clientFile?: Types.ObjectId;
  requestDate?: Date;
  createdBy?: string;
  createdByName?: string;
  sent?: boolean;
  sentAt?: Date;
  sentBy?: string;
  createdAt: Date;
  updatedAt: Date;
  // #endregion
}

const ShipmentSchema = new Schema<IShipment>(
  {
    lastName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    phone2: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    companyOrRole: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    part: { type: String, required: true, trim: true },
    clientFile: {
      type: Schema.Types.ObjectId,
      ref: "clientfile",
      default: null,
    },
    requestDate: { type: Date, default: null },
    createdBy: { type: String },
    createdByName: { type: String },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date, default: null },
    sentBy: { type: String, default: null },
  },
  { timestamps: true },
);

ShipmentSchema.index({ createdBy: 1 });
ShipmentSchema.index({ createdAt: -1 });

const ShipmentModel: Model<IShipment> = mongoose.model<IShipment>(
  "shipment",
  ShipmentSchema,
);

export default ShipmentModel;
