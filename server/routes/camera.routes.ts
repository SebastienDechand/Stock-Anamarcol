import { Router } from "express";
import * as cameraController from "../controllers/camera.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Proxy for camera streams (HTTPS → HTTP)
router.get("/stream/:cameraId", requireAuth, cameraController.getCameraStream);

export default router;
