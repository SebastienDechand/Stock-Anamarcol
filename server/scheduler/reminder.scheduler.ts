import cron from "node-cron";
import { checkAndSendVehicleReminders } from "../services/reminderVehicle/reminderVehicle.service";

/**
 * Starts the vehicle reminders scheduler.
 * Runs every day at 08:00 (Europe/Paris).
 */
export function startReminderScheduler(): void {
  // Cron expression: "0 8 * * *" = every day at 08:00
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log(
        "[Scheduler] Starting vehicle reminders check...",
      );
      try {
        const reminders = await checkAndSendVehicleReminders();
        if (reminders.length > 0) {
          console.log(
            `[Scheduler] ${reminders.length} reminder(s) sent successfully`,
          );
        } else {
          console.log("[Scheduler] No reminders to send today");
        }
      } catch (error) {
        console.error(
          "[Scheduler] Error while checking reminders:",
          error,
        );
      }
    },
    {
      timezone: "Europe/Paris",
    },
  );

  console.log(
    "[Scheduler] Vehicle reminders enabled (every day at 08:00 CET)",
  );
}
