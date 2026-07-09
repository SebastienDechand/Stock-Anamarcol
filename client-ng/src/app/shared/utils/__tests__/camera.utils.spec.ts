import { describe, it, expect } from 'vitest';
import { getCameraStreamUrl } from '../camera.utils';
import { environment } from '../../../../environments/environment';
import type { CameraConfig } from '../../constants/cameras.constants';

describe('getCameraStreamUrl', () => {
  it('should build the stream URL from the API base URL and the camera id', () => {
    const camera: CameraConfig = {
      id: 'camera_1',
      name: 'SURVEILLANCE.CAMERA_DEPOT',
      port: 50002,
      cameraId: '413',
    };
    expect(getCameraStreamUrl(camera)).toBe(`${environment.apiUrl}api/cameras/stream/camera_1`);
  });

  it('should interpolate a different camera id', () => {
    const camera: CameraConfig = {
      id: 'camera_2',
      name: 'SURVEILLANCE.CAMERA_BUREAU',
      port: 50001,
      cameraId: '413',
    };
    expect(getCameraStreamUrl(camera)).toBe(`${environment.apiUrl}api/cameras/stream/camera_2`);
  });
});
