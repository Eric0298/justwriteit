import { Resend } from "resend";

type NotifyPayload = {
  transcriptionId: string;
  userEmail: string;
  userName: string;
  language: string;
  type: string;
  createdAt: string;
  textSnippet: string;
  detailUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(payload: NotifyPayload): string {
  const typeLabel = payload.type === "live" ? "en vivo" : "de archivo";
  const safeSnippet = escapeHtml(payload.textSnippet);
  const safeUserName = escapeHtml(payload.userName);
  const safeLanguage = escapeHtml(payload.language.toUpperCase());
  const safeDetailUrl = escapeHtml(payload.detailUrl);
  const snippet = payload.textSnippet
    ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #6366f1;background:#f8f8ff;color:#444;font-style:italic;border-radius:4px;">${safeSnippet}...</blockquote>`
    : "";

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Transcripcion lista</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                Tu transcripcion ${typeLabel} ha finalizado correctamente.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 8px;color:#111;font-size:15px;">Hola, <strong>${safeUserName}</strong>.</p>
              <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
                Tu transcripcion en <strong>${safeLanguage}</strong> ya esta disponible.
              </p>

              ${snippet}

              <a href="${safeDetailUrl}"
                 style="display:inline-block;margin-top:24px;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
                Ver transcripcion completa
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
              <p style="margin:0;color:#aaa;font-size:12px;">
                JustWriteIt - Este email se envio automaticamente, no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function notifyTranscriptionCompleted(payload: NotifyPayload): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn("Resend no configurado (faltan RESEND_API_KEY o RESEND_FROM_EMAIL).");
    return { ok: false, error: "Resend no configurado (faltan env vars)." };
  }

  try {
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: payload.userEmail,
      subject: "Tu transcripcion esta lista - JustWriteIt",
      html: buildEmailHtml(payload),
    });

    if (error) {
      console.error("Resend error:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error enviando email";
    console.error("mailer failed:", message);
    return { ok: false, error: message };
  }
}

