import { Router } from "express";
import * as statisticsController from "../controllers/stats.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Auth middleware sur toutes les routes stats
router.use(requireAuth);

// Dashboard unifié (1 requête = toutes les stats)
router.get("/dashboard", statisticsController.getDashboardStats);

// Statistiques générales (rétrocompatibilité)
router.get("/articles", statisticsController.getNumberOfArticles);
router.get("/stock", statisticsController.getTotalStock);
router.get("/fournisseurs", statisticsController.getNumberOfSuppliers);
router.get(
  "/articles/stockinf5",
  statisticsController.getNumberOfArticlesWithStockBelow5,
);
router.get("/articles/low-stock", statisticsController.getArticlesWithLowStock);

// Fournisseurs
router.get("/fournisseurs/list", statisticsController.getFournisseursList);
router.get(
  "/fournisseurs/:fournisseur",
  statisticsController.getStatisticsForFournisseur,
);

// État
router.get("/etats/list", statisticsController.getEtatsList);
router.get("/etats/:etat", statisticsController.getStatisticsForEtat);

export default router;
