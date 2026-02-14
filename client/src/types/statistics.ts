import type { Item } from "./item";

export interface GlobalStatistics {
  numberOfArticles: number;
  totalStock: number;
  numberOfSuppliers: number;
  numberOfLowStockArticles: number;
}

export interface FournisseurStats {
  numberOfArticles: number;
  totalStock: number;
  numberOfLowStockArticles: number;
  nom?: string;
}

export interface StatisticsState {
  globalStatistics: GlobalStatistics;
  articlesWithLowStock: Item[];
  fournisseursStats: Record<string, FournisseurStats>;
  etatsStats: Record<string, FournisseurStats>;
  fournisseursList: string[];
  etatsList: string[];
}
