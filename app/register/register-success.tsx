"use client";

import { Button } from "@heroui/react";
import { type CredentialData } from "@/lib/features/register/credential";
import { CheckIcon } from "./icons";
import { QrVisual, saveCredentialPng } from "./qr-visual";

export { credentialCheckinUrl, folioLabel } from "@/lib/features/register/credential";
export type { CredentialData } from "@/lib/features/register/credential";

export function QrCredentialCard({ credential }: { credential: CredentialData }) {
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

      <QrVisual credential={credential} />

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
          onPress={() => void saveCredentialPng(credential)}
          variant="secondary"
        >
          Descargar credencial
        </Button>
      </div>
    </div>
  );
}
