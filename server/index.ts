import dotenv from "dotenv";
// In production, env variables are already defined by the host
// Only load .env file if CLIENT_URL is not already set
if (!process.env.CLIENT_URL) {
  dotenv.config({ path: "./config/.env" });
}
import { connectDB } from "./config/db";
import app from "./app";
import { motionDetectionService } from "./services/motionDetection.service";
import { purgeOldEntries } from "./services/purge.service";

// Wait for MongoDB before accepting requests
connectDB().then(async () => {
  await motionDetectionService.loadState();

  // Run initial purge and then every 6 hours
  await purgeOldEntries();
  setInterval(purgeOldEntries, 6 * 60 * 60 * 1000);

  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
  });
});
