import { Resend } from "resend";

let resend: Resend | null = null;

const getResendClient = (): Resend => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// #region Vehicle Reminder Emails
export interface VehicleReminderData {
  vehicleName: string;
  daysUntil: number;
  dueDate: Date;
  type: "revision" | "ct" | "anti_pollution";
}

function formatDateFR(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

function getReminderBannerColor(daysUntil: number): string {
  if (daysUntil === 0) return "#c0392b"; // Dark red for day of control
  if (daysUntil <= 7) return "#e74c3c"; // Red for 1 week
  return "#f39c12"; // Orange for 1 month
}

function getReminderTitle(daysUntil: number): string {
  if (daysUntil === 0) return "⚠️ RAPPEL URGENT - JOUR DU CONTRÔLE";
  if (daysUntil <= 7) return "📌 RAPPEL - 1 SEMAINE";
  return "📅 RAPPEL - 1 MOIS";
}

function getReminderConfig(type: "revision" | "ct" | "anti_pollution") {
  const configs = {
    revision: {
      title: "Révision annuelle",
      description: "La révision annuelle du véhicule doit être renouvelée",
      warningBg: "#fff8e1",
      warningBorder: "#f39c12",
      warningText: "#856404",
      warningMsg:
        "Important : Veuillez planifier la révision dès que possible pour éviter une surcharge à la dernière minute.",
    },
    ct: {
      title: "Contrôle Technique",
      description: "Le Contrôle Technique du véhicule expire",
      warningBg: "#ffe9e9",
      warningBorder: "#e74c3c",
      warningText: "#c0392b",
      warningMsg:
        "Attention : Circuler sans CT valide est une infraction. Tous les véhicules doivent être contrôlés dans les délais légaux.",
    },
    anti_pollution: {
      title: "Contrôle Anti-Pollution",
      description: "Le Contrôle Anti-Pollution du véhicule expire",
      warningBg: "#f0f5e9",
      warningBorder: "#27ae60",
      warningText: "#27ae60",
      warningMsg:
        "Respect de l'environnement : Le contrôle anti-pollution garantit que nos véhicules respectent les normes d'émission en vigueur.",
    },
  };
  return configs[type];
}

export const sendVehicleReminder = async (
  to: string,
  data: VehicleReminderData,
): Promise<void> => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Mailer] RESEND_API_KEY not configured - email skipped");
    return;
  }

  const bannerColor = getReminderBannerColor(data.daysUntil);
  const reminderTitle = getReminderTitle(data.daysUntil);
  const config = getReminderConfig(data.type);

  await getResendClient().emails.send({
    from: "ANAMARCOL Flotte <onboarding@resend.dev>",
    to,
    subject: `${data.vehicleName?.toUpperCase()} - ${config.title} (${data.daysUntil}j)`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4a7c59,#3a6147);padding:28px 32px;text-align:center;">
            <p style="margin:0 0 4px 0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">ANAMARCOL</p>
            <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;">Gestion Flotte</h1>
          </td>
        </tr>

        <!-- Vehicle name banner -->
        <tr>
          <td style="background:#2c3e50;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
              ${data.vehicleName?.toUpperCase()}
            </p>
          </td>
        </tr>

        <!-- Alert banner -->
        <tr>
          <td style="background:${bannerColor};padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
              &nbsp;${reminderTitle}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">

            <p style="margin:0 0 24px 0;font-size:15px;color:#444;line-height:1.6;">
              ${config.description} dans <strong>${data.daysUntil} jour(s)</strong>.
            </p>

            <!-- Info card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">

                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e9ecef;">
                        <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Type de maintenance</span><br>
                        <span style="font-size:16px;font-weight:700;color:#222;">${config.title}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e9ecef;">
                        <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Jours restants</span><br>
                        <span style="font-size:16px;font-weight:700;color:${bannerColor};">${data.daysUntil} jour(s)</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">
                        <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Date limite</span><br>
                        <span style="font-size:15px;color:#333;">${formatDateFR(data.dueDate)}</span>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- Warning note -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${config.warningBg};border-left:4px solid ${config.warningBorder};border-radius:4px;padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:${config.warningText};line-height:1.5;">
                    <strong>${config.title} :</strong> ${config.warningMsg}
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;border-top:1px solid #e9ecef;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">
              Ce message a été généré automatiquement par le système de gestion ANAMARCOL.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
    `,
  });
};
// #endregion
