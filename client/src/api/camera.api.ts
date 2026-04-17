import axios from "axios";

const BASE = `${import.meta.env.VITE_API_URL}api/cameras`;

export interface CameraMotionState {
  cameraId: string;
  name: string;
  enabled: boolean;
  lastAlertAt: number | null;
}

export interface MotionDetectionStatus {
  globalEnabled: boolean;
  cameras: CameraMotionState[];
}

export const fetchMotionStatus = (): Promise<MotionDetectionStatus> =>
  axios
    .get<MotionDetectionStatus>(`${BASE}/motion-detection`, {
      withCredentials: true,
    })
    .then((r) => r.data);

export const setGlobalMotion = (
  enabled: boolean,
): Promise<MotionDetectionStatus> =>
  axios
    .patch<MotionDetectionStatus>(
      `${BASE}/motion-detection/global`,
      { enabled },
      { withCredentials: true },
    )
    .then((r) => r.data);

export const setCameraMotion = (
  cameraId: string,
  enabled: boolean,
): Promise<MotionDetectionStatus> =>
  axios
    .patch<MotionDetectionStatus>(
      `${BASE}/motion-detection/${cameraId}`,
      { enabled },
      { withCredentials: true },
    )
    .then((r) => r.data);
