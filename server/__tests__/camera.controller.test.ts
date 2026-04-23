import { Request, Response } from "express";

const mockGetStatusForUser = jest.fn();
const mockSetGlobal = jest.fn();
const mockSetCamera = jest.fn();

jest.mock("../services/motionDetection.service", () => ({
  motionDetectionService: {
    getStatusForUser: (...args: unknown[]) => mockGetStatusForUser(...args),
    setGlobal: (...args: unknown[]) => mockSetGlobal(...args),
    setCamera: (...args: unknown[]) => mockSetCamera(...args),
  },
}));

jest.mock("../constants/cameras", () => ({
  CAMERAS_CONFIG: [
    { id: "entrance", port: 80, cameraId: 1 },
    { id: "warehouse", port: 80, cameraId: 2 },
  ],
  CAMERA_BASE_URL: "192.168.1.100",
  CAMERA_CREDENTIALS: { username: "admin", password: "pass" },
}));

import {
  getMotionStatus,
  setGlobalMotion,
  setCameraMotion,
} from "../controllers/camera.controller";

describe("Camera Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn() as unknown as Response["json"],
      locals: { user: { _id: "user123", email: "user@test.com" } },
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── getMotionStatus ──────────────────────────────────
  describe("getMotionStatus", () => {
    it("should return motion detection status for user", () => {
      const mockStatus = {
        globalEnabled: true,
        cameras: [
          { cameraId: "entrance", enabled: true },
          { cameraId: "warehouse", enabled: false },
        ],
      };
      mockGetStatusForUser.mockReturnValue(mockStatus);

      getMotionStatus(req as Request, res as Response);

      expect(mockGetStatusForUser).toHaveBeenCalledWith(
        "user123",
        "user@test.com",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStatus);
    });
  });

  // ─── setGlobalMotion ──────────────────────────────────
  describe("setGlobalMotion", () => {
    it("should enable global motion detection", () => {
      req.body = { enabled: true };
      const mockStatus = { globalEnabled: true, cameras: [] };
      mockSetGlobal.mockReturnValue(mockStatus);

      setGlobalMotion(req as Request, res as Response);

      expect(mockSetGlobal).toHaveBeenCalledWith(
        "user123",
        "user@test.com",
        true,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStatus);
    });

    it("should disable global motion detection", () => {
      req.body = { enabled: false };
      const mockStatus = { globalEnabled: false, cameras: [] };
      mockSetGlobal.mockReturnValue(mockStatus);

      setGlobalMotion(req as Request, res as Response);

      expect(mockSetGlobal).toHaveBeenCalledWith(
        "user123",
        "user@test.com",
        false,
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 if enabled is not boolean", () => {
      req.body = { enabled: "true" };

      setGlobalMotion(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Le champ 'enabled' (boolean) est requis",
      });
      expect(mockSetGlobal).not.toHaveBeenCalled();
    });

    it("should return 400 if enabled is missing", () => {
      req.body = {};

      setGlobalMotion(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Le champ 'enabled' (boolean) est requis",
      });
    });
  });

  // ─── setCameraMotion ──────────────────────────────────
  describe("setCameraMotion", () => {
    it("should enable motion detection for specific camera", () => {
      req.params = { cameraId: "entrance" };
      req.body = { enabled: true };
      const mockStatus = {
        globalEnabled: true,
        cameras: [{ cameraId: "entrance", enabled: true }],
      };
      mockSetCamera.mockReturnValue(mockStatus);

      setCameraMotion(req as Request, res as Response);

      expect(mockSetCamera).toHaveBeenCalledWith(
        "user123",
        "user@test.com",
        "entrance",
        true,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStatus);
    });

    it("should disable motion detection for specific camera", () => {
      req.params = { cameraId: "warehouse" };
      req.body = { enabled: false };
      const mockStatus = {
        globalEnabled: true,
        cameras: [{ cameraId: "warehouse", enabled: false }],
      };
      mockSetCamera.mockReturnValue(mockStatus);

      setCameraMotion(req as Request, res as Response);

      expect(mockSetCamera).toHaveBeenCalledWith(
        "user123",
        "user@test.com",
        "warehouse",
        false,
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 if enabled is not boolean", () => {
      req.params = { cameraId: "entrance" };
      req.body = { enabled: null };

      setCameraMotion(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Le champ 'enabled' (boolean) est requis",
      });
      expect(mockSetCamera).not.toHaveBeenCalled();
    });

    it("should return 404 if camera not found", () => {
      req.params = { cameraId: "nonexistent" };
      req.body = { enabled: true };

      setCameraMotion(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Caméra introuvable" });
      expect(mockSetCamera).not.toHaveBeenCalled();
    });

    it("should return 500 on service error", () => {
      req.params = { cameraId: "entrance" };
      req.body = { enabled: true };
      mockSetCamera.mockImplementation(() => {
        throw new Error("Service error");
      });

      setCameraMotion(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Erreur interne du serveur",
      });
    });
  });
});
