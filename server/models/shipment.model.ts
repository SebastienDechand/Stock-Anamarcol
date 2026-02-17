import mongoose, { Document, Model, Schema } from "mongoose";

export interface IShipment extends Document {
  /* ── Fiche client ── */
  nom: string;
  prenom: string;
  tel?: string;
  tel2?: string;
  email?: string;
  adresse: string;
  codePostal: string;
  ville: string;
  societeOuFonction: string;
  societe: string;
  /* ── Envoi ── */
  piece: string;
  requestDate?: Date;
  createdBy?: string;
  createdByName?: string;
  sent?: boolean;
  sentAt?: Date;
  sentBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentSchema = new Schema<IShipment>(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    tel: { type: String, trim: true },
    tel2: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    adresse: { type: String, required: true, trim: true },
    codePostal: { type: String, required: true, trim: true },
    ville: { type: String, required: true, trim: true },
    societeOuFonction: { type: String, required: true, trim: true },
    societe: { type: String, required: true, trim: true },
    piece: { type: String, required: true, trim: true },
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
