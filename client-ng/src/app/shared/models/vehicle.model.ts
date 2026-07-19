export type VehicleBrand = 'mercedes' | 'nissan';
export type VehicleModel = 'citan' | 'vito' | 'navara';
export type VehicleFormat = 'van' | 'pickup' | 'truck';
export type DocumentType = 'service_invoice' | 'inspection' | 'anti_pollution' | 'other';

export interface VehicleDocument {
  _id?: string;
  name: string;
  filename: string;
  type: DocumentType;
  uploadedAt: Date | string;
  uploadedBy?: string;
}

export interface Vehicle {
  _id?: string;
  brand: VehicleBrand;
  model: VehicleModel;
  format: VehicleFormat;
  licensePlate: string;
  serviceDate?: Date | string;
  inspectionDate?: Date | string;
  inspectionExpiryDate?: Date | string;
  antiPollutionInspectionDate?: Date | string;
  antiPollutionExpiryDate?: Date | string;
  assignedTo?: string | { _id: string; username: string; email?: string; position?: string };
  assignedToName?: string;
  notes?: string;
  documents: VehicleDocument[];
  createdBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface VehicleForm {
  brand: VehicleBrand;
  model: VehicleModel;
  format: VehicleFormat;
  licensePlate: string;
  serviceDate?: string;
  inspectionDate?: string;
  inspectionExpiryDate?: string;
  antiPollutionInspectionDate?: string;
  antiPollutionExpiryDate?: string;
  assignedTo?: string;
  notes?: string;
}
