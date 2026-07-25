import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend, MockResendCtor } = vi.hoisted(() => {
  const send = vi.fn().mockResolvedValue({ data: { id: "email1" } });
  function ResendCtor(this: { emails: { send: typeof send } }) {
    this.emails = { send };
  }
  return { mockSend: send, MockResendCtor: ResendCtor };
});

vi.mock("resend", () => ({
  Resend: MockResendCtor,
}));

import { sendVehicleReminder } from "./mailer";

describe("mailer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("sendVehicleReminder", () => {
    it("should skip sending and warn when RESEND_API_KEY is not configured", async () => {
      vi.stubEnv("RESEND_API_KEY", "");

      await sendVehicleReminder("admin@test.com", {
        vehicleName: "Vito 1",
        daysUntil: 7,
        dueDate: new Date("2026-03-01"),
        type: "ct",
      });

      expect(mockSend).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        "[Mailer] RESEND_API_KEY not configured - email skipped",
      );
    });

    it("should send a CT reminder email with the right subject and recipient", async () => {
      vi.stubEnv("RESEND_API_KEY", "test-key");

      await sendVehicleReminder("admin@test.com", {
        vehicleName: "Vito 1",
        daysUntil: 7,
        dueDate: new Date("2026-03-01"),
        type: "ct",
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "admin@test.com",
          subject: expect.stringContaining("VITO 1"),
        }),
      );
      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Contrôle Technique");
    });

    it("should use the urgent 'day of control' title when daysUntil is 0", async () => {
      vi.stubEnv("RESEND_API_KEY", "test-key");

      await sendVehicleReminder("admin@test.com", {
        vehicleName: "Citan 2",
        daysUntil: 0,
        dueDate: new Date("2026-03-01"),
        type: "revision",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("JOUR DU CONTRÔLE");
    });

    it("should use the '1 week' title when 1 <= daysUntil <= 7", async () => {
      vi.stubEnv("RESEND_API_KEY", "test-key");

      await sendVehicleReminder("admin@test.com", {
        vehicleName: "Citan 2",
        daysUntil: 5,
        dueDate: new Date("2026-03-01"),
        type: "revision",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("1 SEMAINE");
    });

    it("should use the '1 month' title when daysUntil > 7", async () => {
      vi.stubEnv("RESEND_API_KEY", "test-key");

      await sendVehicleReminder("admin@test.com", {
        vehicleName: "Citan 2",
        daysUntil: 30,
        dueDate: new Date("2026-03-01"),
        type: "revision",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("1 MOIS");
    });

    it("should include the anti-pollution wording for that reminder type", async () => {
      vi.stubEnv("RESEND_API_KEY", "test-key");

      await sendVehicleReminder("admin@test.com", {
        vehicleName: "Navara 3",
        daysUntil: 10,
        dueDate: new Date("2026-03-01"),
        type: "anti_pollution",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Contrôle Anti-Pollution");
    });
  });
});
