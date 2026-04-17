import Jimp from "jimp";
import {
  CAMERAS_CONFIG,
  CAMERA_BASE_URL,
  CAMERA_SNAPSHOT_PATH,
  CAMERA_CREDENTIALS,
  type CameraConfig,
} from "../constants/cameras";
import { sendMotionAlert } from "../utils/mailer";
import UserMotionPreferenceModel from "../models/motionDetection.model";

const POLL_INTERVAL_MS = 2_000;
const MOTION_THRESHOLD_PCT = 1; // Increased from 0.35 to reduce false positives from grain
const ALERT_COOLDOWN_MS = 300_000; // 5 minutes per camera (system-wide)
const FRAME_SIZE = 64;
const BLUR_RADIUS = 2; // Apply Gaussian blur to reduce noise

interface UserState {
  userId: string;
  userEmail: string;
  globalEnabled: boolean;
  cameras: Map<string, boolean>; // cameraId → enabled
}

class MotionDetectionService {
  private users = new Map<string, UserState>(); // userId → state
  private intervals = new Map<string, NodeJS.Timeout>(); // cameraId → interval
  private lastFrames = new Map<string, number[] | null>(); // cameraId → pixels
  private lastAlertAt = new Map<string, number>(); // cameraId → timestamp
  private isFetching = new Map<string, boolean>(); // cameraId → bool

  constructor() {
    for (const config of CAMERAS_CONFIG) {
      this.lastFrames.set(config.id, null);
      this.isFetching.set(config.id, false);
    }
  }

  // Called once after MongoDB is ready
  async loadState(): Promise<void> {
    try {
      const saved = await UserMotionPreferenceModel.find().lean();
      for (const doc of saved) {
        const cameras = new Map<string, boolean>();
        for (const cam of doc.cameras) {
          cameras.set(cam.cameraId, cam.enabled);
        }
        this.users.set(doc.userId, {
          userId: doc.userId,
          userEmail: doc.userEmail,
          globalEnabled: doc.globalEnabled,
          cameras,
        });
      }
      for (const config of CAMERAS_CONFIG) {
        this.syncPolling(config.id);
      }
      console.log(
        `[MotionDetection] État restauré — ${saved.length} utilisateur(s)`,
      );
    } catch (err) {
      console.error("[MotionDetection] Erreur chargement état :", err);
    }
  }

  private async persistUser(userId: string): Promise<void> {
    const state = this.users.get(userId);
    if (!state) return;
    try {
      await UserMotionPreferenceModel.findOneAndUpdate(
        { userId },
        {
          userEmail: state.userEmail,
          globalEnabled: state.globalEnabled,
          cameras: Array.from(state.cameras.entries()).map(
            ([cameraId, enabled]) => ({ cameraId, enabled }),
          ),
        },
        { upsert: true, returnDocument: "after" },
      );
    } catch (err) {
      console.error("[MotionDetection] Erreur sauvegarde :", err);
    }
  }

  private getOrCreateUser(userId: string, userEmail: string): UserState {
    if (!this.users.has(userId)) {
      const cameras = new Map<string, boolean>();
      for (const config of CAMERAS_CONFIG) {
        cameras.set(config.id, false);
      }
      this.users.set(userId, {
        userId,
        userEmail,
        globalEnabled: false,
        cameras,
      });
    }
    return this.users.get(userId)!;
  }

  // A camera is polled if at least one user has it enabled (with global on)
  private isActiveForAnyUser(cameraId: string): boolean {
    for (const user of this.users.values()) {
      if (user.globalEnabled && (user.cameras.get(cameraId) ?? false))
        return true;
    }
    return false;
  }

  // All users to notify when motion is detected on a camera
  private getRecipients(cameraId: string): string[] {
    const recipients: string[] = [];
    for (const user of this.users.values()) {
      if (user.globalEnabled && (user.cameras.get(cameraId) ?? false)) {
        recipients.push(user.userEmail);
      }
    }
    return recipients;
  }

  getStatusForUser(userId: string, userEmail: string) {
    const user = this.getOrCreateUser(userId, userEmail);
    return {
      globalEnabled: user.globalEnabled,
      cameras: CAMERAS_CONFIG.map((config) => ({
        cameraId: config.id,
        name: config.name,
        enabled: user.cameras.get(config.id) ?? false,
        lastAlertAt: this.lastAlertAt.get(config.id) ?? null,
      })),
    };
  }

  setGlobal(
    userId: string,
    userEmail: string,
    enabled: boolean,
  ): ReturnType<typeof this.getStatusForUser> {
    const user = this.getOrCreateUser(userId, userEmail);
    user.globalEnabled = enabled;
    for (const config of CAMERAS_CONFIG) {
      this.syncPolling(config.id);
    }
    void this.persistUser(userId);
    return this.getStatusForUser(userId, userEmail);
  }

  setCamera(
    userId: string,
    userEmail: string,
    cameraId: string,
    enabled: boolean,
  ): ReturnType<typeof this.getStatusForUser> {
    const user = this.getOrCreateUser(userId, userEmail);
    user.cameras.set(cameraId, enabled);
    this.syncPolling(cameraId);
    void this.persistUser(userId);
    return this.getStatusForUser(userId, userEmail);
  }

  private syncPolling(cameraId: string): void {
    const shouldPoll = this.isActiveForAnyUser(cameraId);
    const config = CAMERAS_CONFIG.find((c) => c.id === cameraId)!;

    if (shouldPoll && !this.intervals.has(cameraId)) {
      const interval = setInterval(
        () => void this.poll(cameraId),
        POLL_INTERVAL_MS,
      );
      this.intervals.set(cameraId, interval);
      console.log(`[MotionDetection] Polling démarré — ${config.name}`);
    } else if (!shouldPoll && this.intervals.has(cameraId)) {
      clearInterval(this.intervals.get(cameraId)!);
      this.intervals.delete(cameraId);
      this.lastFrames.set(cameraId, null);
      console.log(`[MotionDetection] Polling arrêté — ${config.name}`);
    }
  }

  private buildSnapshotUrl(config: CameraConfig): string {
    return `http://${CAMERA_BASE_URL}:${config.port}${CAMERA_SNAPSHOT_PATH}?id=${config.cameraId}`;
  }

  private buildAuthHeader(): string {
    const { username, password } = CAMERA_CREDENTIALS;
    return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  private async fetchFrame(config: CameraConfig): Promise<Buffer | null> {
    try {
      const response = await fetch(this.buildSnapshotUrl(config), {
        headers: { Authorization: this.buildAuthHeader() },
        signal: AbortSignal.timeout(4_000),
      });
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    }
  }

  private async toGrayscalePixels(jpegBuffer: Buffer): Promise<number[]> {
    const image = await Jimp.read(jpegBuffer);
    image.resize(FRAME_SIZE, FRAME_SIZE).greyscale().blur(BLUR_RADIUS);
    const pixels: number[] = [];
    for (let i = 0; i < image.bitmap.data.length; i += 4) {
      pixels.push(image.bitmap.data[i]);
    }
    return pixels;
  }

  private computeDiffPct(prev: number[], curr: number[]): number {
    let diff = 0;
    for (let i = 0; i < prev.length; i++) {
      diff += Math.abs(prev[i] - curr[i]);
    }
    return (diff / (prev.length * 255)) * 100;
  }

  private async poll(cameraId: string): Promise<void> {
    if (this.isFetching.get(cameraId)) return;
    this.isFetching.set(cameraId, true);

    const config = CAMERAS_CONFIG.find((c) => c.id === cameraId)!;
    try {
      const frameBuffer = await this.fetchFrame(config);
      if (!frameBuffer) return;

      const pixels = await this.toGrayscalePixels(frameBuffer);
      const lastFrame = this.lastFrames.get(cameraId) ?? null;

      if (lastFrame) {
        const diffPct = this.computeDiffPct(lastFrame, pixels);

        if (diffPct >= MOTION_THRESHOLD_PCT) {
          const now = Date.now();
          const lastAlert = this.lastAlertAt.get(cameraId) ?? 0;
          const cooldownPassed = now - lastAlert >= ALERT_COOLDOWN_MS;

          if (cooldownPassed) {
            this.lastAlertAt.set(cameraId, now);
            const recipients = this.getRecipients(cameraId);
            console.log(
              `[MotionDetection] Mouvement sur ${config.name} (${diffPct.toFixed(1)}%) → ${recipients.join(", ") || "aucun destinataire"}`,
            );
            for (const recipient of recipients) {
              sendMotionAlert(config.name, config.id, recipient).catch(
                (err: unknown) =>
                  console.error("[MotionDetection] Erreur email :", err),
              );
            }
          }
        }
      }

      this.lastFrames.set(cameraId, pixels);
    } catch (err) {
      console.error(`[MotionDetection] Erreur polling ${config.name} :`, err);
    } finally {
      this.isFetching.set(cameraId, false);
    }
  }
}

export const motionDetectionService = new MotionDetectionService();
