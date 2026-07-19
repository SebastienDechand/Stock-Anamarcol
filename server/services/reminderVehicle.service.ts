import VehicleModel, { IVehicle } from "../models/vehicle.model";
import UserModel from "../models/user.model";
import { sendVehicleReminder } from "../utils/mailer";
import { Role } from "../constants";

export interface ReminderCheck {
  vehicleId: string;
  licensePlate: string;
  type: "revision" | "ct" | "anti_pollution";
  daysUntilDue: number;
  reminderType: "jour_du_controle" | "1_week" | "1_month";
}

/**
 * Calcul du nombre de jours jusqu'à l'échéance
 */
function getDaysUntilDue(dueDate: Date | undefined | null): number | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Détermine le type de rappel selon les jours restants
 * Retourne le type de rappel pour les dates exactes :
 * - 0 jour : "jour_du_controle"
 * - 7 jours avant : "1_week"
 * - 30 jours avant : "1_month"
 */
function getReminderType(
  daysUntil: number | null,
): "jour_du_controle" | "1_week" | "1_month" | null {
  if (daysUntil === null) return null;
  if (daysUntil === 0) return "jour_du_controle";
  if (daysUntil === 7) return "1_week";
  if (daysUntil === 30) return "1_month";
  return null;
}

/**
 * Récupère tous les superadmins
 */
async function getSuperAdmins() {
  return UserModel.find(
    {
      $or: [
        { roles: Role.SUPERADMIN },
        { email: process.env.SUPERADMIN_EMAIL?.toLowerCase() },
      ],
    },
    "email username",
  ).lean();
}

/**
 * Vérifie les dates d'échéance et envoie les rappels appropriés
 * Retourne les rappels envoyés
 */
export async function checkAndSendVehicleReminders(): Promise<ReminderCheck[]> {
  const reminders: ReminderCheck[] = [];

  // Récupère tous les superadmins
  const superAdmins = await getSuperAdmins();
  if (superAdmins.length === 0) {
    console.warn("[Reminder] Aucun superadmin trouvé pour envoyer les rappels");
    return [];
  }

  // Récupère tous les véhicules
  const vehicles = await VehicleModel.find().lean();

  for (const vehicle of vehicles) {
    // ─── Révision (anniversaire annuel) ───
    const revisionDays = getDaysUntilDue(
      vehicle.serviceDate
        ? new Date(
            new Date(vehicle.serviceDate).getTime() +
              365 * 24 * 60 * 60 * 1000,
          )
        : null,
    );
    const revisionReminderType = getReminderType(revisionDays);
    if (revisionReminderType && revisionDays !== null) {
      const reminderType = revisionReminderType;
      reminders.push({
        vehicleId: vehicle._id.toString(),
        licensePlate: vehicle.licensePlate,
        type: "revision",
        daysUntilDue: revisionDays,
        reminderType,
      });
      // Envoie au superadmin
      for (const admin of superAdmins) {
        const nextRevisionDate = vehicle.serviceDate
          ? new Date(
              new Date(vehicle.serviceDate).getTime() +
                365 * 24 * 60 * 60 * 1000,
            )
          : new Date();
        await sendVehicleReminder(admin.email, {
          vehicleName: `${vehicle.brand.toUpperCase()} ${vehicle.model} (${vehicle.licensePlate})`,
          daysUntil: revisionDays,
          dueDate: nextRevisionDate,
          type: "revision",
        }).catch((err) => {
          console.error(
            `[Reminder] Erreur envoi rappel révision pour ${vehicle.licensePlate}:`,
            err,
          );
        });
      }
    }

    // ─── CT (expiration) ───
    const ctDays = getDaysUntilDue(
      vehicle.inspectionExpiryDate ? new Date(vehicle.inspectionExpiryDate) : null,
    );
    const ctReminderType = getReminderType(ctDays);
    if (ctReminderType && ctDays !== null) {
      const reminderType = ctReminderType;
      reminders.push({
        vehicleId: vehicle._id.toString(),
        licensePlate: vehicle.licensePlate,
        type: "ct",
        daysUntilDue: ctDays,
        reminderType,
      });
      // Envoie au superadmin
      for (const admin of superAdmins) {
        await sendVehicleReminder(admin.email, {
          vehicleName: `${vehicle.brand.toUpperCase()} ${vehicle.model} (${vehicle.licensePlate})`,
          daysUntil: ctDays,
          dueDate: vehicle.inspectionExpiryDate
            ? new Date(vehicle.inspectionExpiryDate)
            : new Date(),
          type: "ct",
        }).catch((err) => {
          console.error(
            `[Reminder] Erreur envoi rappel CT pour ${vehicle.licensePlate}:`,
            err,
          );
        });
      }
    }

    // ─── Anti-pollution (expiration) ───
    const antiPollutionDays = getDaysUntilDue(
      vehicle.antiPollutionExpiryDate
        ? new Date(vehicle.antiPollutionExpiryDate)
        : null,
    );
    const antiPollutionReminderType = getReminderType(antiPollutionDays);
    if (antiPollutionReminderType && antiPollutionDays !== null) {
      const reminderType = antiPollutionReminderType;
      reminders.push({
        vehicleId: vehicle._id.toString(),
        licensePlate: vehicle.licensePlate,
        type: "anti_pollution",
        daysUntilDue: antiPollutionDays,
        reminderType,
      });
      // Envoie au superadmin
      for (const admin of superAdmins) {
        await sendVehicleReminder(admin.email, {
          vehicleName: `${vehicle.brand.toUpperCase()} ${vehicle.model} (${vehicle.licensePlate})`,
          daysUntil: antiPollutionDays,
          dueDate: vehicle.antiPollutionExpiryDate
            ? new Date(vehicle.antiPollutionExpiryDate)
            : new Date(),
          type: "anti_pollution",
        }).catch((err) => {
          console.error(
            `[Reminder] Erreur envoi rappel anti-pollution pour ${vehicle.licensePlate}:`,
            err,
          );
        });
      }
    }
  }

  if (reminders.length > 0) {
    console.log(
      `[Reminder] ${reminders.length} rappel(s) envoyé(s) au superadmin`,
    );
  }

  return reminders;
}
