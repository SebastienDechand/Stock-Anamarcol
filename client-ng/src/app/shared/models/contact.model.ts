export type ContactCategory = 'external' | 'supplier';

export interface Contact {
  _id: string;
  name: string;
  email?: string;
  link?: string;
  picture?: string;
  position?: string;
  phone?: string;
  category?: ContactCategory;
  createdAt?: string;
  updatedAt?: string;
}
