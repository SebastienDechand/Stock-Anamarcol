import { Request, Response } from "express";
import { checkAndSendVehicleReminders } from "../services/reminderVehicle.service";

/**
 * POST /api/reminders/vehicles/send
 * Déclenche manuellement l'envoi des rappels véhicules
 * Superadmin uniquement
 */
export const sendVehicleReminders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const reminders = await checkAndSendVehicleReminders();

    if (reminders.length === 0) {
      res.status(200).json({
        message: "Aucun rappel à envoyer (aucune échéance dans 30j ou 7j)",
        reminders: [],
      });
      return;
    }

    res.status(200).json({
      message: `${reminders.length} rappel(s) envoyé(s) avec succès`,
      reminders,
    });
  } catch (error) {
    console.error("[Controller] Erreur envoi rappels:", error);
    res.status(500).json({
      message: "Erreur lors de l'envoi des rappels",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
