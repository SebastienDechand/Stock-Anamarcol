import { Router } from "express";
import * as cameraController from "../controllers/camera.controller";

const router = Router();

// Proxy for camera streams (HTTPS → HTTP)
router.get("/stream/:cameraId", cameraController.getCameraStream);

export default router;
