import { useState, useEffect, useCallback } from "react";
import {
  fetchMotionStatus,
  setGlobalMotion,
  setCameraMotion,
  type MotionDetectionStatus,
} from "../api/camera.api";

export function useMotionDetection() {
  const [status, setStatus] = useState<MotionDetectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMotionStatus()
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleGlobal = useCallback(async (enabled: boolean) => {
    const updated = await setGlobalMotion(enabled);
    setStatus(updated);
  }, []);

  const toggleCamera = useCallback(
    async (cameraId: string, enabled: boolean) => {
      const updated = await setCameraMotion(cameraId, enabled);
      setStatus(updated);
    },
    [],
  );

  const isCameraEnabled = useCallback(
    (cameraId: string): boolean =>
      status?.cameras.find((c) => c.cameraId === cameraId)?.enabled ?? false,
    [status],
  );

  return {
    status,
    loading,
    globalEnabled: status?.globalEnabled ?? false,
    toggleGlobal,
    toggleCamera,
    isCameraEnabled,
  };
}
