import type { CameraConfig } from "../constants/cameras.constants";

/**
 * Construit l'URL d'accès à une caméra IP
 * Utilise toujours le proxy serveur pour éviter les problèmes CORS et Mixed Content
 */
export const buildCameraUrl = (config: CameraConfig): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  return `${apiUrl}api/cameras/stream/${config.id}`;
};

export const getCameraStreamUrl = (config: CameraConfig): string =>
  buildCameraUrl(config);
