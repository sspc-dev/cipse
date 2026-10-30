"use client";

/**
 * Visual y composición PNG de la credencial QR, compartidos entre el
 * registro público y el panel de administración. Requiere APIs del
 * navegador (canvas), por lo que solo puede usarse desde componentes
 * cliente.
 */
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import {
  CREDENTIAL_QR_OPTIONS,
  credentialCheckinUrl,
  folioLabel,
  type CredentialData,
} from "@/lib/features/register/credential";

const QR_SIZE = 232;
const LOGO_BOX = 64;
/* Dimensiones de la imagen descargable; más resolución que la vista web. */
const PNG_SIZE = 560;
/* Espacio reservado a título y nombre sobre el QR en la imagen descargable. */
const PNG_HEADER_HEIGHT = 140;

export function QrVisual({ credential }: { credential: CredentialData }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const origin = window.location.origin;
    QRCode.toDataURL(
      credentialCheckinUrl(credential.accessCode, origin),
      CREDENTIAL_QR_OPTIONS,
    )
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch((error) => {
        console.error("[qr-visual] No se pudo generar el QR:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [credential.accessCode]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_18px_50px_-24px_rgba(16,24,29,0.35)]">
      <div className="relative" style={{ width: QR_SIZE, height: QR_SIZE }}>
        {qrDataUrl ? (
          /* El QR es un dataURL que no debe pasar por optimización de next/image. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`Código de acceso ${folioLabel(credential.id)} de ${credential.name}`}
            className="size-full"
            src={qrDataUrl}
          />
        ) : (
          <div className="size-full animate-pulse rounded-lg bg-zinc-200" />
        )}
        <div
          className="absolute inset-0 m-auto flex items-center justify-center rounded-lg border border-white bg-white"
          style={{ width: LOGO_BOX, height: LOGO_BOX }}
        >
          {/* Requiere coordenadas exactas y sin reoptimización sobre el QR. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            aria-hidden="true"
            className="size-[85%] object-contain"
            src="/imgs/SSPC.png"
          />
        </div>
      </div>
      <p className="font-mono text-xs font-semibold tracking-[0.14em] text-zinc-900">
        {folioLabel(credential.id)}
      </p>
    </div>
  );
}

/** Compone la credencial en PNG (mismo formato que la vista de registro). */
async function composeCredentialPng(
  credential: CredentialData,
): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(
    credentialCheckinUrl(credential.accessCode, window.location.origin),
    CREDENTIAL_QR_OPTIONS,
  );

  const canvas = document.createElement("canvas");
  canvas.width = PNG_SIZE;
  canvas.height = PNG_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D no disponible en este navegador.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
  ctx.font = "600 28px sans-serif";
  ctx.fillStyle = "#0a0f14";
  ctx.textAlign = "center";
  ctx.fillText(`CIPSE XV · ${folioLabel(credential.id)}`, PNG_SIZE / 2, 64);
  ctx.fillText(credential.name, PNG_SIZE / 2, 104);

  const qr = new Image();
  qr.src = qrDataUrl;
  await new Promise<void>((resolve, reject) => {
    qr.onload = () => resolve();
    qr.onerror = () => reject(new Error("No se pudo cargar el QR."));
  });
  const qrSide = PNG_SIZE - PNG_HEADER_HEIGHT;
  ctx.drawImage(
    qr,
    (PNG_SIZE - qrSide) / 2,
    PNG_HEADER_HEIGHT,
    qrSide,
    qrSide,
  );

  const logo = new Image();
  logo.src = "/imgs/SSPC.png";
  await new Promise<void>((resolve) => {
    logo.onload = () => resolve();
    logo.onerror = () => resolve();
  });
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    (PNG_SIZE - LOGO_BOX * 2 - 8) / 2,
    PNG_HEADER_HEIGHT + (qrSide - LOGO_BOX * 2 - 8) / 2,
    LOGO_BOX * 2 + 8,
    LOGO_BOX * 2 + 8,
  );
  ctx.drawImage(
    logo,
    (PNG_SIZE - LOGO_BOX * 2) / 2,
    PNG_HEADER_HEIGHT + (qrSide - LOGO_BOX * 2) / 2,
    LOGO_BOX * 2,
    LOGO_BOX * 2,
  );

  return canvas.toDataURL("image/png");
}

/** Descarga la credencial compuesta con el nombre estándar por folio. */
export async function saveCredentialPng(
  credential: CredentialData,
): Promise<void> {
  const dataUrl = await composeCredentialPng(credential);

  const link = document.createElement("a");
  link.download = `credencial-${folioLabel(credential.id)}.png`;
  link.href = dataUrl;
  link.click();
}
