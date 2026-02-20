export type ClientFileDocType =
  | "bdc"
  | "rapport"
  | "pvrecette"
  | "visite"
  | "autre";

export interface ClientFileDoc {
  _id: string;
  name: string;
  filename: string;
  type: ClientFileDocType;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface Equipement {
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

export interface ClientFile {
  _id: string;
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
  joursFermeture?: string;
  visitePreinstallation: boolean;
  dateInstallationSouhaitee?: string;
  dateFormationSouhaitee?: string;
  saisirFichierProduit: boolean;
  decoupePlanMenuiserie: boolean;
  decoupePlanMarbrerie: boolean;
  ouverturePrevue?: string;
  equipement: Equipement;
  remarques?: string;
  documents?: ClientFileDoc[];
  contactRef?:
    | string
    | { _id: string; nom: string; email?: string; tel?: string };
  dateInstallation?: string;
  dateRenouvellement?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientFileForm = Omit<
  ClientFile,
  "_id" | "createdAt" | "updatedAt" | "createdBy"
>;
