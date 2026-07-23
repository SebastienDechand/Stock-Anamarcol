import cron from "node-cron";
import { checkAndSendVehicleReminders } from "../services/reminderVehicle.service";

/**
 * Démarre le scheduler pour les rappels véhicules
 * Exécute chaque jour à 08:00 (Europe/Paris)
 */
export function startReminderScheduler(): void {
  // Expression cron : "0 8 * * *" = chaque jour à 08:00
  const task = cron.schedule(
    "0 8 * * *",
    async () => {
      console.log(
        "[Scheduler] Démarrage de la vérification des rappels véhicules...",
      );
      try {
        const reminders = await checkAndSendVehicleReminders();
        if (reminders.length > 0) {
          console.log(
            `[Scheduler] ${reminders.length} rappel(s) envoyé(s) avec succès`,
          );
        } else {
          console.log("[Scheduler] Aucun rappel à envoyer aujourd'hui");
        }
      } catch (error) {
        console.error(
          "[Scheduler] Erreur lors de la vérification des rappels:",
          error,
        );
      }
    },
    {
      timezone: "Europe/Paris",
    },
  );

  console.log(
    "[Scheduler] Rappels véhicules activés (chaque jour à 08:00 CET)",
  );

  return task as any;
}

/**
 * Arrête le scheduler
 */
export function stopReminderScheduler(task: any): void {
  if (task) {
    task.stop();
    console.log("[Scheduler] Rappels véhicules arrêtés");
  }
}
