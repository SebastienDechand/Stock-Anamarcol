import dotenv from "dotenv";
// In production, env variables are already defined by the host
// Only load .env file if CLIENT_URL is not already set
if (!process.env.CLIENT_URL) {
  dotenv.config({ path: "./config/.env" });
}
import { connectDB } from "./config/db";
import app from "./app";
import { purgeOldEntries } from "./services/purge/purge.service";
import { startReminderScheduler } from "./scheduler/reminder.scheduler";

// Wait for MongoDB before accepting requests
connectDB().then(async () => {
  // Run initial purge and then every 6 hours
  await purgeOldEntries();
  setInterval(purgeOldEntries, 6 * 60 * 60 * 1000);

  // Start reminder scheduler (daily at 08:00 CET)
  startReminderScheduler();

  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
  });
});
