// Credentials et configuration des caméras
export const CAMERA_CREDENTIALS = {
  username: "root",
  password: "admin",
} as const;

export interface CameraConfig {
  id: string;
  name: string;
  port: number;
  cameraId: string;
}

export const CAMERAS_CONFIG: CameraConfig[] = [
  {
    id: "camera_1",
    name: "Dépôt",
    port: 50002,
    cameraId: "413",
  },
  {
    id: "camera_2",
    name: "Bureau",
    port: 50001,
    cameraId: "413",
  },
];

export const CAMERA_BASE_URL = "80.14.140.205";
export const CAMERA_VIEW_PATH = "/axis-cgi/mjpg/video.cgi";
