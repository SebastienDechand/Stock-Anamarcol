import { Router } from "express";
import * as auditController from "../controllers/audit.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Only admins (and superadmins) can read the full audit history
router.get("/", requireAdmin, auditController.getHistory);

export default router;
