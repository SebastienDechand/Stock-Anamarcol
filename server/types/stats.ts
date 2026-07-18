export interface SupplierOrStateStats {
  name: string;
  numberOfArticles: number;
  totalStock: number;
  numberOfLowStockArticles: number;
}

export interface DashboardGlobalStats {
  numberOfArticles: number;
  totalStock: number;
  numberOfSuppliers: number;
  numberOfLowStockArticles: number;
  cgKit: number;
  tpvKit: number;
}

export interface LowStockItemResult {
  _id: string;
  name: string;
  supplier: string;
  status: string;
  quantity: number;
}

export interface DashboardResult {
  global: DashboardGlobalStats;
  suppliers: SupplierOrStateStats[];
  statuses: SupplierOrStateStats[];
  lowStockItems: LowStockItemResult[];
}
