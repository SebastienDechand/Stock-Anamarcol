export interface GlobalStatistics {
  numberOfArticles: number;
  totalStock: number;
  numberOfSuppliers: number;
  numberOfLowStockArticles: number;
  cgKit?: number;
  tpvKit?: number;
}

export interface SupplierStats {
  numberOfArticles: number;
  totalStock: number;
  numberOfLowStockArticles: number;
  name?: string;
}

export interface LowStockItem {
  _id: string;
  name: string;
  supplier: string;
  status: string;
  quantity: number;
}

export interface DashboardStats {
  global: GlobalStatistics;
  suppliers: SupplierStats[];
  lowStockItems: LowStockItem[];
}
