export interface Item {
  _id: string;
  posterId: string;
  modifierName?: string;
  name: string;
  quantity: number;
  supplier: string;
  image?: string;
  status: string;
  cgKit?: boolean;
  tpvKit?: boolean;
  preparation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewItem {
  name: string;
  supplier: string;
  quantity: number;
  status: string;
  posterId: string;
  modifierId?: string;
  modifierName?: string;
  cgKit?: boolean;
  tpvKit?: boolean;
}

export interface FetchItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  supplier?: string[];
  status?: string[];
  cgKit?: boolean;
  tpvKit?: boolean;
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
