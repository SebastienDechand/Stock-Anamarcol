import { Router } from "express";
import * as statisticsController from "../controllers/stats/stats.controller";
import { requireAuth } from "../middleware/auth/auth.middleware";

const router = Router();

// Auth middleware on all stats routes
router.use(requireAuth);

// Unified dashboard (1 request = all stats)
router.get("/dashboard", statisticsController.getDashboardStats);

// General statistics (backward compatibility)
router.get("/articles", statisticsController.getNumberOfArticles);
router.get("/stock", statisticsController.getTotalStock);
router.get("/suppliers", statisticsController.getNumberOfSuppliers);
router.get(
  "/articles/stockinf5",
  statisticsController.getNumberOfArticlesWithStockBelow5,
);
router.get("/articles/low-stock", statisticsController.getArticlesWithLowStock);

// Suppliers
router.get("/suppliers/list", statisticsController.getSuppliersList);
router.get(
  "/suppliers/:supplier",
  statisticsController.getStatisticsForSupplier,
);

// Status
router.get("/statuses/list", statisticsController.getStatusesList);
router.get("/statuses/:status", statisticsController.getStatisticsForStatus);

export default router;
