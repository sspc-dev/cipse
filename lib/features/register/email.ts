/**
 * Envío del QR de credencial por correo con SMTP.
 * Server-only: nunca importar desde componentes cliente.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { toBuffer } from "qrcode";
import nodemailer, { type Transporter } from "nodemailer";

export type EmailDelivery =
  | { state: "sent" }
  | { state: "failed"; reason: string }
  | { state: "skipped"; reason: string };

type CredentialEmailInput = {
  to: string;
  folio: string;
  fullName: string;
  accessCode: string;
  origin: string;
};

/* Corrección de nivel H (~30 % de daño recuperable), igual que la credencial web. */
const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  scale: 8,
  color: {
    dark: "#0a0f14",
    light: "#ffffff",
  },
} as const;

let transporterPromise: Promise<Transporter> | null = null;

function smtpConfigured(): boolean {
  return Boolean(process.env["SMTP_HOST"]);
}

function getTransporter(): Promise<Transporter> | null {
  if (!smtpConfigured()) return null;

  transporterPromise ??= Promise.resolve(
    nodemailer.createTransport({
      host: process.env["SMTP_HOST"],
      port: Number(process.env["SMTP_PORT"] ?? 587),
      secure: Number(process.env["SMTP_PORT"] ?? 587) === 465,
      auth: process.env["SMTP_USER"]
        ? {
            user: process.env["SMTP_USER"],
            pass: process.env["SMTP_PASSWORD"],
          }
        : undefined,
    }),
  );

  return transporterPromise;
}

function credentialHtml(input: CredentialEmailInput): string {
  const { folio, fullName, origin } = input;

  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px">',
    `<p style="color:#6b7280;font-size:12px;letter-spacing:.08em;">CIPSE XV · MÉXICO 2026</p>`,
    `<h2 style="color:#10181d;margin:0 0 12px;">Credencial de acceso</h2>`,
    `<p style="color:#374151;font-size:14px;">Hola, <strong>${escapeHtml(fullName)}</strong>. Su solicitud quedó registrada con folio <strong style="font-family:monospace;">${escapeHtml(folio)}</strong>.</p>`,
    `<p style="color:#374151;font-size:14px;">Presente este código QR en el acceso del congreso. También encontrará la imagen adjunta para guardar o imprimir.</p>`,
    `<img width="240" height="240" src="cid:credential-qr" alt="Código de acceso ${escapeHtml(folio)}" style="background:#ffffff;padding:12px;border:1px solid #e5e7eb;border-radius:12px;" />`,
    `<p style="color:#6b7280;font-size:11px;margin-top:16px;">Gobierno de México · SSPC — CIPSE XV. ${escapeHtml(origin)}</p>`,
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendCredentialEmail(
  input: CredentialEmailInput,
): Promise<EmailDelivery> {
  try {
    if (!smtpConfigured()) {
      return {
        state: "skipped",
        reason:
          "SMTP no configurado en el entorno: el registro continúa sin envío.",
      };
    }

    const transporter = await getTransporter();
    if (!transporter) {
      return { state: "skipped", reason: "SMTP no disponible." };
    }

    const checkinUrl = `${input.origin}/checkin?c=${input.accessCode}`;
    const qrPng = await toBuffer(checkinUrl, QR_OPTIONS);

    const logoPath = path.join(process.cwd(), "public", "imgs", "SSPC.png");
    const logoPng = await readFile(logoPath);

    await transporter.sendMail({
      from: process.env["SMTP_FROM"] ?? process.env["SMTP_USER"],
      to: input.to,
      subject: `Credencial de acceso ${input.folio} — CIPSE XV México 2026`,
      text: [
        `CIPSE XV · México 2026`,
        ``,
        `Hola, ${input.fullName}. Su solicitud quedó registrada con folio ${input.folio}.`,
        `Presente su código QR en el acceso del congreso.`,
        `Código de acceso: ${input.accessCode}`,
        ``,
        `Gobierno de México · SSPC`,
      ].join("\n"),
      html: credentialHtml(input),
      attachments: [
        {
          filename: "credencial-qr.png",
          content: qrPng,
          contentType: "image/png",
        },
        {
          filename: "SSPC.png",
          content: logoPng,
          contentType: "image/png",
        },
      ],
    });

    return { state: "sent" };
  } catch (error) {
    console.error(
      "[sendCredentialEmail] No se pudo enviar la credencial:",
      error,
    );
    return {
      state: "failed",
      reason:
        "No fue posible enviar la credencial por correo en este momento.",
    };
  }
}
