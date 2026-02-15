import { Router } from "express";
import * as auditController from "../controllers/audit.controller";
import {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
} from "../middleware/auth.middleware";

const router = Router();

// Only admins (and superadmins) can read the full audit history
router.get("/", requireAdmin, auditController.getHistory);

// Superadmins only: purge both audit + history
router.post(
  "/purge",
  requireSuperAdmin,
  auditController.purgeAllHistoryAndAudit,
);

export default router;
