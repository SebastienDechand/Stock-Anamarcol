import { Resend } from "resend";

let resend: Resend | null = null;

const getResendClient = (): Resend => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export const sendMotionAlert = async (
  cameraName: string,
  cameraId: string,
  to: string,
): Promise<void> => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Mailer] RESEND_API_KEY non configuré — email ignoré");
    return;
  }

  const clientUrl = (process.env.CLIENT_URL ?? "").replace(/\/$/, "");
  const surveillanceUrl = `${clientUrl}/surveillance`;
  const streamUrl = `${clientUrl}/surveillance?flux=${cameraId}`;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
  const timeStr = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Paris",
  });

  await getResendClient().emails.send({
    from: "AnaMarCol Surveillance <onboarding@resend.dev>",
    to,
    subject: `🚨 Mouvement détecté — ${cameraName} (${timeStr})`,
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
            <p style="margin:0 0 4px 0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">AnaMarCol</p>
            <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;">Système de Surveillance</h1>
          </td>
        </tr>

        <!-- Alert banner -->
        <tr>
          <td style="background:#c0392b;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
              ⚠️ &nbsp;MOUVEMENT DÉTECTÉ
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">

            <p style="margin:0 0 24px 0;font-size:15px;color:#444;line-height:1.6;">
              Un mouvement a été détecté par le système de surveillance automatique.
              Veuillez vérifier le flux vidéo dès que possible.
            </p>

            <!-- Info card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">

                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e9ecef;">
                        <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Caméra</span><br>
                        <span style="font-size:16px;font-weight:700;color:#222;">${cameraName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e9ecef;">
                        <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Date</span><br>
                        <span style="font-size:15px;color:#333;text-transform:capitalize;">${dateStr}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">
                        <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Heure</span><br>
                        <span style="font-size:22px;font-weight:700;color:#c0392b;">${timeStr}</span>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- CTA buttons -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${surveillanceUrl}"
                     style="display:inline-block;background:#4a7c59;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;">
                    🖥️ &nbsp;Ouvrir la page surveillance
                  </a>
                </td>
              </tr>
            </table>

            <!-- Warning note -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#fff8e1;border-left:4px solid #f39c12;border-radius:4px;padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:#856404;line-height:1.5;">
                    <strong>Note :</strong> Si vous recevez plusieurs alertes, un délai de 5 minutes est appliqué entre chaque notification pour éviter le spam.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;border-top:1px solid #e9ecef;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#aaa;">
              Ce message a été généré automatiquement par le système de surveillance ANAMARCOL.
            </p>
            <p style="margin:0;font-size:12px;color:#aaa;">
              Pour désactiver les alertes, rendez-vous sur la page surveillance.
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
