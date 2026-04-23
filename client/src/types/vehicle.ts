export type VehicleBrand = "mercedes" | "nissan";
export type VehicleModel = "citan" | "vito" | "navara";
export type VehicleFormat = "utilitaire" | "pickup" | "camion";
export type DocumentType =
  | "facture_revision"
  | "ct"
  | "anti_pollution"
  | "autre";

export interface VehicleDocument {
  _id?: string;
  name: string;
  filename: string;
  type: DocumentType;
  uploadedAt: Date;
  uploadedBy?: string;
}

export interface Vehicle {
  _id?: string;
  marque: VehicleBrand;
  modele: VehicleModel;
  format: VehicleFormat;
  immatriculation: string;
  dateRevision?: Date | string;
  dateCtInspection?: Date | string;
  dateCtExpiration?: Date | string;
  dateControlAntiPollutionInspection?: Date | string;
  dateControlAntiPollutionExpiration?: Date | string;
  assignedTo?: string;
  assignedToName?: string;
  documents: VehicleDocument[];
  createdBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface VehicleForm {
  marque: VehicleBrand;
  modele: VehicleModel;
  format: VehicleFormat;
  immatriculation: string;
  dateRevision?: string;
  dateCtInspection?: string;
  dateCtExpiration?: string;
  dateControlAntiPollutionInspection?: string;
  dateControlAntiPollutionExpiration?: string;
  assignedTo?: string;
  notes?: string;
}

export interface VehiclesState {
  vehicles: Vehicle[];
  isLoading: boolean;
  error?: string;
  selectedVehicleId?: string;
  totalPages?: number;
  currentPage?: number;
}
