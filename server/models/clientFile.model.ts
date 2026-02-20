import mongoose, { Document, Model, Schema, Types } from "mongoose";

// ─── Document sub-document ───────────────────────────────────────────────────
export type ClientFileDocType =
  | "bdc"
  | "rapport"
  | "pvrecette"
  | "visite"
  | "autre";

export interface IClientFileDoc {
  _id: Types.ObjectId;
  name: string;
  filename: string;
  type: ClientFileDocType;
  uploadedAt: Date;
  uploadedBy?: string;
}

// ─── Equipment sub-document ───────────────────────────────────────────────────
export interface IEquipement {
  nbCashguard: number;
  nbFusion: number;
  nbCaisses: number;
  nbAutresMateriels: number;
  nbBalancesCaisses: number;
  licencesTactis: number;
  licencesInno: number;
  pcBackoffice: number;
  borneAllergene: boolean;
  borneCommande: boolean;
  etiquettesElectronique: boolean;
  carteFidelite: boolean;
}

// ─── Main interface ───────────────────────────────────────────────────────────
export interface IClientFile extends Document {
  // Identity
  societe?: string;
  nom: string;
  prenom?: string;
  adresse?: string;
  cp?: string;
  ville?: string;
  tel?: string;
  mobile?: string;
  email?: string;
  statutJuridique?: string;
  raisonSociale?: string;
  nomMagasin?: string;
  siret?: string;
  tvaIntra?: string;
  codeNaf?: string;
  // Planning
  joursFermeture?: string;
  visitePreinstallation: boolean;
  dateInstallationSouhaitee?: string;
  dateFormationSouhaitee?: string;
  saisirFichierProduit: boolean;
  decoupePlanMenuiserie: boolean;
  decoupePlanMarbrerie: boolean;
  ouverturePrevue?: string;
  // Equipment
  equipement: IEquipement;
  // Remarks
  remarques?: string;
  // Documents
  documents: IClientFileDoc[];
  // Link to existing contact (optional)
  contactRef?: Types.ObjectId;
  // Installation dates (filled by installer via rapport)
  dateInstallation?: Date;
  dateRenouvellement?: Date;
  // Meta
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const equipementSchema = new Schema<IEquipement>(
  {
    nbCashguard: { type: Number, default: 0 },
    nbFusion: { type: Number, default: 0 },
    nbCaisses: { type: Number, default: 0 },
    nbAutresMateriels: { type: Number, default: 0 },
    nbBalancesCaisses: { type: Number, default: 0 },
    licencesTactis: { type: Number, default: 0 },
    licencesInno: { type: Number, default: 0 },
    pcBackoffice: { type: Number, default: 0 },
    borneAllergene: { type: Boolean, default: false },
    borneCommande: { type: Boolean, default: false },
    etiquettesElectronique: { type: Boolean, default: false },
    carteFidelite: { type: Boolean, default: false },
  },
  { _id: false },
);

const clientFileDocSchema = new Schema<IClientFileDoc>(
  {
    name: { type: String, required: true },
    filename: { type: String, required: true },
    type: {
      type: String,
      enum: ["bdc", "rapport", "pvrecette", "visite", "autre"],
      default: "autre",
    },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String },
  },
  { _id: true },
);

const clientFileSchema = new Schema<IClientFile>(
  {
    societe: { type: String, trim: true },
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, trim: true },
    adresse: { type: String, trim: true },
    cp: { type: String, trim: true },
    ville: { type: String, trim: true },
    tel: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    statutJuridique: { type: String, trim: true },
    raisonSociale: { type: String, trim: true },
    nomMagasin: { type: String, trim: true },
    siret: { type: String, trim: true },
    tvaIntra: { type: String, trim: true },
    codeNaf: { type: String, trim: true },
    joursFermeture: { type: String, trim: true },
    visitePreinstallation: { type: Boolean, default: false },
    dateInstallationSouhaitee: { type: String, trim: true },
    dateFormationSouhaitee: { type: String, trim: true },
    saisirFichierProduit: { type: Boolean, default: false },
    decoupePlanMenuiserie: { type: Boolean, default: false },
    decoupePlanMarbrerie: { type: Boolean, default: false },
    ouverturePrevue: { type: String, trim: true },
    equipement: { type: equipementSchema, default: () => ({}) },
    remarques: { type: String, trim: true },
    documents: { type: [clientFileDocSchema], default: [] },
    contactRef: { type: Schema.Types.ObjectId, ref: "contact" },
    dateInstallation: { type: Date },
    dateRenouvellement: { type: Date },
    createdBy: { type: String },
  },
  { timestamps: true },
);

const ClientFileModel: Model<IClientFile> = mongoose.model<IClientFile>(
  "clientfile",
  clientFileSchema,
);

export default ClientFileModel;
