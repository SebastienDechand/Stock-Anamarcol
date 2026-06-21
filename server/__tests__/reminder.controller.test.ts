import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

const mockCheckAndSendVehicleReminders = vi.fn();

vi.mock("../services/reminderVehicle.service", () => ({
  checkAndSendVehicleReminders: (...args: unknown[]) =>
    mockCheckAndSendVehicleReminders(...args),
}));

import { sendVehicleReminders } from "../controllers/reminder.controller";

describe("Reminder Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
    };
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── sendVehicleReminders ──────────────────────────────
  describe("sendVehicleReminders", () => {
    it("should return 200 with reminders when checks find results", async () => {
      const mockReminders = [
        {
          vehicleId: "vehicle123",
          immatriculation: "AB-123-CD",
          type: "ct" as const,
          daysUntilDue: 7,
          reminderType: "1_week" as const,
        },
        {
          vehicleId: "vehicle456",
          immatriculation: "EF-456-GH",
          type: "revision" as const,
          daysUntilDue: 30,
          reminderType: "1_month" as const,
        },
      ];
      mockCheckAndSendVehicleReminders.mockResolvedValue(mockReminders);

      await sendVehicleReminders(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "2 rappel(s) envoyé(s) avec succès",
        reminders: mockReminders,
      });
    });

    it("should return 200 with empty message when no reminders found", async () => {
      mockCheckAndSendVehicleReminders.mockResolvedValue([]);

      await sendVehicleReminders(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Aucun rappel à envoyer (aucune échéance dans 30j ou 7j)",
        reminders: [],
      });
    });

    it("should return 500 on service error", async () => {
      const error = new Error("Service error");
      mockCheckAndSendVehicleReminders.mockRejectedValue(error);

      await sendVehicleReminders(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Erreur lors de l'envoi des rappels",
        error: "Service error",
      });
    });

    it("should handle non-Error exceptions", async () => {
      mockCheckAndSendVehicleReminders.mockRejectedValue("Unknown error");

      await sendVehicleReminders(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Erreur lors de l'envoi des rappels",
        error: "Unknown error",
      });
    });
  });
});
