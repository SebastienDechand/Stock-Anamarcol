import type { Item } from "./item";

export interface GlobalStatistics {
  numberOfArticles: number;
  totalStock: number;
  numberOfSuppliers: number;
  numberOfLowStockArticles: number;
  prepaCG?: number;
  prepaTPV?: number;
}

export interface FournisseurStats {
  numberOfArticles: number;
  totalStock: number;
  numberOfLowStockArticles: number;
  nom?: string;
}

export interface LowStockItem {
  _id: string;
  denomination: string;
  fournisseur: string;
  etat: string;
  quantite: number;
}

export interface DashboardStats {
  global: GlobalStatistics;
  fournisseurs: FournisseurStats[];
  lowStockItems: LowStockItem[];
}

export interface StatisticsState {
  globalStatistics: GlobalStatistics;
  articlesWithLowStock: Item[];
  fournisseursStats: Record<string, FournisseurStats>;
  etatsStats: Record<string, FournisseurStats>;
  fournisseursList: string[];
  etatsList: string[];
}
