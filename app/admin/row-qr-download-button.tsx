"use client";

import { useState } from "react";
import type { CredentialData } from "@/lib/features/register/credential";
import { DownloadIcon } from "@/app/register/icons";
import { saveCredentialPng } from "@/app/register/qr-visual";

type RowCredentialButtonProps = Pick<
  CredentialData,
  "id" | "name" | "lastname" | "accessCode"
> & {
  className?: string;
};

/**
 * Descarga en el navegador la credencial compuesta (mismo formato que la
 * vista de registro) para un delegado del listado del panel.
 */
export function RowQrDownloadButton({
  id,
  name,
  lastname,
  accessCode,
  className,
}: RowCredentialButtonProps) {
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");

  async function download() {
    if (state === "pending") return;

    setState("pending");
    try {
      await saveCredentialPng({ id, name, lastname, accessCode });
      setState("done");
    } catch (error) {
      console.error("[row-qr-download] No se pudo descargar:", error);
      setState("idle");
    }
  }

  return (
    <button
      aria-label={`Descargar QR de ${name} ${lastname}`}
      className={className}
      disabled={state === "pending"}
      onClick={() => void download()}
      type="button"
    >
      <DownloadIcon className="size-3.5" aria-hidden="true" />
      {state === "done" ? "Descargada" : state === "pending" ? "Generando…" : "Descargar QR"}
    </button>
  );
}
