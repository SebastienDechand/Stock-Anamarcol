import { Router } from "express";
import * as shipmentsController from "../controllers/shipments.controller";
import {
  requireAuth,
  requireHotline,
  requireAdmin,
} from "../middleware/auth.middleware";

const router = Router();

// Visible to all authenticated users
router.get("/", requireAuth, shipmentsController.getShipments);
// Archives — admin / superadmin only
router.get("/archives", requireAdmin, shipmentsController.getArchives);
router.get(
  "/archives/:id/download",
  requireAdmin,
  shipmentsController.downloadArchive,
);
router.post("/archive", requireAdmin, shipmentsController.createArchive);
router.post("/", requireHotline, shipmentsController.createShipment);
// Mark as sent (Hotline or Admin)
router.put("/:id/sent", requireHotline, shipmentsController.markSent);
// Delete (admin only)
router.delete("/:id", requireAdmin, shipmentsController.deleteShipment);

export default router;
