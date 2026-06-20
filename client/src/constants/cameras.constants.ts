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
