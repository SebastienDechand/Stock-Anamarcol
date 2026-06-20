import { Router } from "express";
import * as cameraController from "../controllers/camera.controller";

const router = Router();

// Proxy pour les flux des caméras (HTTPS → HTTP)
router.get("/stream/:cameraId", cameraController.getCameraStream);

export default router;
