export type ClientFileDocType =
  | 'purchase_order'
  | 'report'
  | 'acceptance_report'
  | 'visit'
  | 'other';

export interface ClientFileDoc {
  _id: string;
  name: string;
  filename: string;
  type: ClientFileDocType;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface Equipement {
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

export interface ClientFile {
  _id: string;
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
  closingDays?: string;
  preInstallationVisit: boolean;
  desiredInstallationDate?: string;
  desiredTrainingDate?: string;
  productFileEntry: boolean;
  carpentryPlanCutout: boolean;
  stoneworkPlanCutout: boolean;
  plannedOpening?: string;
  equipment: Equipement;
  notes?: string;
  documents?: ClientFileDoc[];
  contactRef?: string | { _id: string; name: string; email?: string; phone?: string };
  dateInstallation?: string;
  dateRenouvellement?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientFileForm = Omit<ClientFile, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
