/**
 * Envío del QR de credencial por correo con SMTP.
 * Server-only: nunca importar desde componentes cliente.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { formatMessage } from "@/lib/i18n/format";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { generateCredentialQrPng } from "./qr";

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
  locale: Locale;
};

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

function credentialHtml(
  input: CredentialEmailInput,
  copy: Dictionary["email"],
): string {
  const { folio, fullName, origin } = input;

  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px">',
    `<p style="color:#6b7280;font-size:12px;letter-spacing:.08em;">CIPSE XV · MÉXICO 2026</p>`,
    `<h2 style="color:#10181d;margin:0 0 12px;">${escapeHtml(copy.heading)}</h2>`,
    `<p style="color:#374151;font-size:14px;">${escapeHtml(
      formatMessage(copy.greeting, {
        name: fullName,
        folio,
      }),
    )}</p>`,
    `<p style="color:#374151;font-size:14px;">${escapeHtml(copy.instructions)}</p>`,
    `<img width="240" height="240" src="cid:credential-qr" alt="${escapeHtml(
      formatMessage(copy.qrAlt, { folio }),
    )}" style="background:#ffffff;padding:12px;border:1px solid #e5e7eb;border-radius:12px;" />`,
    `<p style="color:#6b7280;font-size:11px;margin-top:16px;">${escapeHtml(
      copy.footer,
    )} ${escapeHtml(origin)}</p>`,
  ].join("\n");
}

function credentialText(
  input: CredentialEmailInput,
  copy: Dictionary["email"],
): string {
  const { folio, fullName, accessCode } = input;

  return [
    `CIPSE XV · México 2026`,
    ``,
    formatMessage(copy.textGreeting, { name: fullName, folio }),
    copy.textInstructions,
    formatMessage(copy.textCode, { code: accessCode }),
    ``,
    `Gobierno de México · SSPC`,
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
  const copy = getDictionary(input.locale).email;

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

    const qrPng = await generateCredentialQrPng(input.accessCode, input.origin);

    const logoPath = path.join(process.cwd(), "public", "imgs", "SSPC.png");
    const logoPng = await readFile(logoPath);

    await transporter.sendMail({
      from: process.env["SMTP_FROM"] ?? process.env["SMTP_USER"],
      to: input.to,
      subject: formatMessage(copy.subject, { folio: input.folio }),
      text: credentialText(input, copy),
      html: credentialHtml(input, copy),
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
