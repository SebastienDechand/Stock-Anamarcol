import { Request, Response } from "express";
import http from "http";
import { motionDetectionService } from "../services/motionDetection.service";
import {
  CAMERAS_CONFIG,
  CAMERA_BASE_URL,
  CAMERA_CREDENTIALS,
} from "../constants/cameras";

export const getMotionStatus = (req: Request, res: Response): void => {
  const { _id: userId, email: userEmail } = res.locals.user;
  res
    .status(200)
    .json(motionDetectionService.getStatusForUser(String(userId), userEmail));
};

export const setGlobalMotion = (req: Request, res: Response): void => {
  const { enabled } = req.body as { enabled: unknown };

  if (typeof enabled !== "boolean") {
    res
      .status(400)
      .json({ message: "Le champ 'enabled' (boolean) est requis" });
    return;
  }

  const { _id: userId, email: userEmail } = res.locals.user;
  const status = motionDetectionService.setGlobal(
    String(userId),
    userEmail,
    enabled,
  );
  res.status(200).json(status);
};

export const setCameraMotion = (req: Request, res: Response): void => {
  const cameraId = req.params.cameraId as string;
  const { enabled } = req.body as { enabled: unknown };

  if (typeof enabled !== "boolean") {
    res
      .status(400)
      .json({ message: "Le champ 'enabled' (boolean) est requis" });
    return;
  }

  if (!CAMERAS_CONFIG.some((c) => c.id === cameraId)) {
    res.status(404).json({ message: "Caméra introuvable" });
    return;
  }

  const { _id: userId, email: userEmail } = res.locals.user;
  try {
    const status = motionDetectionService.setCamera(
      String(userId),
      userEmail,
      cameraId,
      enabled,
    );
    res.status(200).json(status);
  } catch {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

/**
 * Proxy endpoint pour les flux des caméras (prod)
 * Évite Mixed Content: HTTPS → HTTP
 */
export const getCameraStream = (req: Request, res: Response): void => {
  const cameraId = req.params.cameraId as string;
  const camera = CAMERAS_CONFIG.find((c) => c.id === cameraId);

  if (!camera) {
    res.status(404).json({ message: "Caméra introuvable" });
    return;
  }

  const cameraUrl = `http://${CAMERA_BASE_URL}:${camera.port}/axis-cgi/mjpg/video.cgi?id=${camera.cameraId}`;
  const auth = Buffer.from(
    `${CAMERA_CREDENTIALS.username}:${CAMERA_CREDENTIALS.password}`,
  ).toString("base64");

  const request = http.get(
    cameraUrl,
    {
      timeout: 10000,
      headers: {
        Authorization: `Basic ${auth}`,
      },
    },
    (cameraRes) => {
      if (cameraRes.statusCode && cameraRes.statusCode >= 400) {
        console.error(
          `[Caméra ${cameraId}] Erreur upstream: ${cameraRes.statusCode}`,
        );
        cameraRes.resume();
        if (!res.headersSent)
          res.status(503).json({ message: "Erreur caméra" });
        return;
      }

      res.setHeader(
        "Content-Type",
        cameraRes.headers["content-type"] ||
          "multipart/x-mixed-replace; boundary=--myboundary",
      );
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, no-transform",
      );
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");

      // Ensure headers are sent immediately before streaming data
      res.flushHeaders();
      cameraRes.pipe(res);
    },
  );

  req.on("close", () => {
    request.destroy();
  });

  request.on("error", (error) => {
    console.error(`[Caméra ${cameraId}] Erreur:`, error.message);
    if (!res.headersSent) {
      res.status(503).json({ message: "Caméra inaccessible" });
    }
  });

  request.on("timeout", () => {
    request.destroy();
  });
};
