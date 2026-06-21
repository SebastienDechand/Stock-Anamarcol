import { environment } from '../../../environments/environment';
import { CameraConfig } from '../constants/cameras.constants';

export function getCameraStreamUrl(camera: CameraConfig): string {
  return `${environment.apiUrl}api/cameras/stream/${camera.id}`;
}
