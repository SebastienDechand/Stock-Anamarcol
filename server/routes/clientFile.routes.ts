import { Router } from "express";
import * as clientFileController from "../controllers/clientFile.controller";
import {
  requireAuth,
  requireAdmin,
  requireMonteur,
} from "../middleware/auth.middleware";

const router = Router();

// All authenticated users can view
router.get("/", requireAuth, clientFileController.getClientFiles);
router.get("/:id", requireAuth, clientFileController.getClientFile);

// Create / update: monteur, admin, superadmin
router.post("/", requireMonteur, clientFileController.createClientFile);
router.put("/:id", requireMonteur, clientFileController.updateClientFile);

// Delete: admin/superadmin only
router.delete("/:id", requireAdmin, clientFileController.deleteClientFile);

export default router;
