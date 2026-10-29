"use client";

import { Button } from "@heroui/react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "./icons";

export function folioLabel(id: number): string {
  return `CIPSE-${String(id).padStart(4, "0")}`;
}

export type CredentialData = {
  id: number;
  name: string;
  lastname: string;
  accessCode: string;
  emailDelivery?: { state: "sent" | "failed" | "skipped" };
};

export function credentialCheckinUrl(
  accessCode: string,
  origin: string,
): string {
  return `${origin}/checkin?c=${accessCode}`;
}

/*
 * Corrección de nivel H (~30 % de daño recuperable) para mantener el QR
 * legible con el logo SSPC superpuesto al centro.
 */
const QR_OPTIONS: QRCode.QRCodeToDataURLOptions = {
  errorCorrectionLevel: "H",
  margin: 2,
  scale: 8,
  color: {
    dark: "#0a0f14",
    light: "#ffffff",
  },
};

const QR_SIZE = 232;
const LOGO_BOX = 64;

export function QrCredentialCard({ credential }: { credential: CredentialData }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const origin = window.location.origin;
    QRCode.toDataURL(
      credentialCheckinUrl(credential.accessCode, origin),
      QR_OPTIONS,
    )
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch((error) => {
        console.error("[qr-certificate] No se pudo generar el QR:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [credential.accessCode]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function downloadCredential() {
    if (!qrDataUrl) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const size = 560;
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.font = "600 28px sans-serif";
        ctx.fillStyle = "#0a0f14";
        ctx.textAlign = "center";
        ctx.fillText(
          `CIPSE XV · ${folioLabel(credential.id)}`,
          size / 2,
          64,
        );
        ctx.fillText(
          credential.name,
          size / 2,
          104,
        );

        const qr = new Image();
        qr.src = qrDataUrl;
        await new Promise<void>((resolve, reject) => {
          qr.onload = () => resolve();
          qr.onerror = () => reject(new Error("No se pudo cargar el QR."));
        });
        const qrSide = size - 120;
        ctx.drawImage(qr, (size - qrSide) / 2, 140, qrSide, qrSide);

        const logo = new Image();
        logo.src = "/imgs/SSPC.png";
        await new Promise<void>((resolve) => {
          logo.onload = () => resolve();
          logo.onerror = () => resolve();
        });
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          (size - LOGO_BOX * 2 - 8) / 2,
          140 + (qrSide - LOGO_BOX * 2 - 8) / 2,
          LOGO_BOX * 2 + 8,
          LOGO_BOX * 2 + 8,
        );
        ctx.drawImage(
          logo,
          (size - LOGO_BOX * 2) / 2,
          140 + (qrSide - LOGO_BOX * 2) / 2,
          LOGO_BOX * 2,
          LOGO_BOX * 2,
        );

        const link = document.createElement("a");
        link.download = `credencial-${folioLabel(credential.id)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    }
  }

  return (
    <div
      className="card-enter flex flex-col items-center gap-6 py-2 text-center"
      role="status"
    >
      <div className="check-pop flex size-16 items-center justify-center rounded-full border border-accent/30 bg-accent-soft">
        <CheckIcon className="size-7 text-accent-soft-foreground" />
      </div>

      <div className="flex flex-col gap-2">
        <h2
          className="font-display text-2xl font-bold tracking-tight text-foreground focus:outline-none"
          tabIndex={-1}
        >
          Solicitud registrada
        </h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
          Presente este código de acceso el día del congreso. Guardarlo es
          suficiente para acreditar su ingreso.
        </p>
      </div>

      <div className="pop-in flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_18px_50px_-24px_rgba(16,24,29,0.35)]">
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

      <dl className="flex w-full flex-col gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-4 py-3.5 text-left">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">
            Delegado
          </dt>
          <dd className="text-sm font-semibold text-foreground">
            {credential.name} {credential.lastname}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">
            Estado
          </dt>
          <dd className="text-sm font-semibold text-foreground">
            pendiente de revisión
          </dd>
        </div>
        {credential.emailDelivery ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">
              Correo
            </dt>
            <dd
              className={
                credential.emailDelivery.state === "sent"
                  ? "text-xs font-semibold text-accent-soft-foreground"
                  : "text-xs font-semibold text-gold-ink"
              }
            >
              {credential.emailDelivery.state === "sent"
                ? "Credencial enviada a su correo"
                : "Sin envío: guarde o descargue su QR aquí"}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button
          className="h-11 rounded-full text-sm font-semibold"
          isDisabled={!qrDataUrl}
          onPress={() => void downloadCredential()}
          variant="secondary"
        >
          Descargar credencial
        </Button>
      </div>

      <canvas className="hidden" ref={canvasRef} />
    </div>
  );
}
