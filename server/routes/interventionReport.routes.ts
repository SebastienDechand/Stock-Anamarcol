import { Router } from "express";
import * as interventionReportController from "../controllers/interventionReport.controller";
import {
  requireAuth,
  requireAdmin,
  requireMonteur,
} from "../middleware/auth.middleware";

const router = Router();

// All authenticated users can view
router.get(
  "/",
  requireAuth,
  interventionReportController.getInterventionReports,
);
router.get(
  "/:id",
  requireAuth,
  interventionReportController.getInterventionReport,
);

// Create / update: monteur, admin, superadmin
router.post(
  "/",
  requireMonteur,
  interventionReportController.createInterventionReport,
);
router.put(
  "/:id",
  requireMonteur,
  interventionReportController.updateInterventionReport,
);

// Delete: admin/superadmin only
router.delete(
  "/:id",
  requireAdmin,
  interventionReportController.deleteInterventionReport,
);

export default router;
