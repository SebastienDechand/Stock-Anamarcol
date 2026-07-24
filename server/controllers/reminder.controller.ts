import { Request, Response } from "express";
import { checkAndSendVehicleReminders } from "../services/reminderVehicle.service";
import { ErrorCode } from "../constants/errorCodes";

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
        message: "No reminders to send (no deadline within 30 or 7 days)",
        code: ErrorCode.NO_REMINDERS_DUE,
        reminders: [],
      });
      return;
    }

    res.status(200).json({
      message: `${reminders.length} reminder(s) sent successfully`,
      code: ErrorCode.REMINDERS_SENT,
      reminders,
    });
  } catch (error) {
    console.error("[Controller] Error sending reminders:", error);
    res.status(500).json({
      message: "Error sending reminders",
      code: ErrorCode.REMINDER_SEND_ERROR,
    });
  }
};
