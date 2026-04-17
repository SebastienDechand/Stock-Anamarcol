import {
  CAMERA_BASE_URL,
  CAMERA_VIEW_PATH,
  type CameraConfig,
} from "../constants/cameras.constants";

/**
 * Construit l'URL d'accès à une caméra IP
 */
export const buildCameraUrl = (config: CameraConfig): string => {
  return `http://${CAMERA_BASE_URL}:${config.port}${CAMERA_VIEW_PATH}?id=${config.cameraId}`;
};

export const getCameraStreamUrl = (config: CameraConfig): string =>
  buildCameraUrl(config);
