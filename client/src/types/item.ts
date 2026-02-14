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
  prepaCaisse?: boolean;
  prepaTPV?: boolean;
  preparation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface History {
  _id: string;
  itemId: string;
  action: "create" | "update" | "delete" | "quantity_change";
  field?: string;
  oldValue?: string;
  newValue?: string;
  userName: string;
  createdAt: string;
}
