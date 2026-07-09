export interface Item {
  _id: string;
  posterId: string;
  modifierName?: string;
  denomination: string;
  quantite: number;
  fournisseur: string;
  image?: string;
  etat: string;
  prepaCG?: boolean;
  prepaTPV?: boolean;
  preparation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewItem {
  denomination: string;
  fournisseur: string;
  quantite: number;
  etat: string;
  posterId: string;
  modifierId?: string;
  modifierName?: string;
  prepaCG?: boolean;
  prepaTPV?: boolean;
}

export interface FetchItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  fournisseur?: string[];
  etat?: string[];
  prepaCG?: boolean;
  prepaTPV?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ItemHistory {
  _id: string;
  itemId: string;
  action: 'create' | 'update' | 'delete' | 'quantity_change';
  field?: string;
  oldValue?: string;
  newValue?: string;
  userName: string;
  createdAt: string;
}
