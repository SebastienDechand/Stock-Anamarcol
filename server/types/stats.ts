export interface SupplierOrStateStats {
  nom: string;
  numberOfArticles: number;
  totalStock: number;
  numberOfLowStockArticles: number;
}

export interface DashboardGlobalStats {
  numberOfArticles: number;
  totalStock: number;
  numberOfSuppliers: number;
  numberOfLowStockArticles: number;
  prepaCG: number;
  prepaTPV: number;
}

export interface LowStockItemResult {
  _id: string;
  denomination: string;
  fournisseur: string;
  etat: string;
  quantite: number;
}

export interface DashboardResult {
  global: DashboardGlobalStats;
  fournisseurs: SupplierOrStateStats[];
  etats: SupplierOrStateStats[];
  lowStockItems: LowStockItemResult[];
}
