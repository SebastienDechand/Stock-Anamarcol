export interface Shipment {
  _id: string;
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
  piece: string;
  requestDate?: string;
  sent?: boolean;
  sentBy?: string;
  createdByName?: string;
  createdAt?: string;
}

export interface ShipmentForm {
  nom: string;
  prenom: string;
  tel: string;
  tel2: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
  societeOuFonction: string;
  societe: string;
  piece: string;
  requestDate: string;
}

export type ExportFormat = "xlsx" | "csv" | "pdf" | "json";
