export interface Shipment {
  _id: string;
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
  part: string;
  clientFile?: string;
  requestDate?: string;
  sent?: boolean;
  sentBy?: string;
  createdByName?: string;
  createdAt?: string;
}

export interface ShipmentForm {
  lastName: string;
  firstName: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  companyOrRole: string;
  company: string;
  part: string;
  requestDate: string;
  clientFile?: string;
}

export type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'json';

export interface ShipmentArchive {
  _id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  shipmentCount: number;
  createdAt: string;
}
