import { Router } from "express";
import { requireAdmin } from "../middleware/auth.middleware";
import * as cameraController from "../controllers/camera.controller";

const router = Router();

router.get("/motion-detection", requireAdmin, cameraController.getMotionStatus);
router.patch(
  "/motion-detection/global",
  requireAdmin,
  cameraController.setGlobalMotion,
);
router.patch(
  "/motion-detection/:cameraId",
  requireAdmin,
  cameraController.setCameraMotion,
);

// Proxy pour les flux des caméras (HTTPS → HTTP)
router.get("/stream/:cameraId", cameraController.getCameraStream);

export default router;
