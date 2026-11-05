/**
 * Ayudantes compartidos de la credencial del congreso.
 * Sin dependencias de Node: utilizable desde Server y Client Components.
 */

export type CredentialData = {
  id: number;
  name: string;
  lastname: string;
  accessCode: string;
  email?: string;
  emailDelivery?: { state: "sent" | "failed" | "skipped" };
};

export function folioLabel(id: number): string {
  return `CIPSE-${String(id).padStart(4, "0")}`;
}

export function credentialCheckinUrl(
  accessCode: string,
  origin: string,
): string {
  return `${origin}/checkin?c=${accessCode}`;
}

/** URL pública del formulario de autorregistro, usada por el QR de registro. */
export function registerUrl(origin: string, locale = "es"): string {
  return `${origin}/${locale}/register`;
}

/*
 * Corrección de nivel H (~30 % de daño recuperable) para mantener el QR
 * legible con el logo SSPC superpuesto al centro.
 */
export const CREDENTIAL_QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  scale: 8,
  color: {
    dark: "#0a0f14",
    light: "#ffffff",
  },
} as const;
