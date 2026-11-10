import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/features/auth/actions";
import { registerUrl } from "@/lib/features/register/credential";
import { QrVisual } from "@/lib/features/register/components/qr-visual";
import { PrintCredentialButton } from "../print-credential-button";

export const metadata: Metadata = {
  title: "QR de registro — CIPSE XV",
  description: "Código QR imprimible para el autorregistro de participantes.",
  robots: { index: false, follow: false },
};

export default function RegisterQrPrintPage() {
  return (
    <Suspense fallback={<RegisterQrSkeleton />}>
      <RegisterQrPrintContent />
    </Suspense>
  );
}

function RegisterQrSkeleton() {
  return (
    <main
      aria-hidden="true"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="flex h-[560px] w-full max-w-xs animate-pulse flex-col gap-4 rounded-2xl bg-foreground/5" />
    </main>
  );
}

async function RegisterQrPrintContent() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/dashboard");
  }

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const url = registerUrl(`${protocol}://${host}`);

  /*
   * QrVisual comparte el diseño de la credencial del participante; para el
   * autorregistro solo se codifica la URL del formulario, sin folio ni nombre.
   */
  const registerCredential = {
    id: 0,
    name: "",
    lastname: "",
    accessCode: "",
  };

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-background px-4 py-10 print:block print:bg-white print:p-0">
      <div className="flex items-center gap-3 print:hidden">
        <Link
          aria-label="Volver al panel de acreditación"
          className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent"
          href="/dashboard"
        >
          ← Panel
        </Link>
        <PrintCredentialButton label="Imprimir QR de registro" />
      </div>

      <div className="w-full max-w-xs rounded-2xl border border-border bg-white p-6 text-center shadow-[0_18px_50px_-24px_rgba(16,24,29,0.35)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <Image
          alt=""
          aria-hidden="true"
          height={120}
          src="/imgs/XV CIPSE logos_vv1.webp"
          width={120}
          className="mx-auto h-12 w-auto"
        />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          CIPSE XV · México 2026
        </p>
        <h1 className="mt-1 font-display text-lg font-bold tracking-tight text-zinc-900">
          Registro de acceso en sitio
        </h1>

        <dl className="mt-4 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Destino
            </dt>
            <dd className="max-w-[70%] break-all text-right font-mono font-semibold tracking-[0.08em] text-zinc-900">
              {url}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Modalidad
            </dt>
            <dd className="font-semibold text-zinc-900">Autorregistro</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
          <QrVisual
            altTemplate="Código QR para registrarse en el congreso CIPSE XV"
            caption={url}
            credential={registerCredential}
            url={url}
          />
          <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">
            Escanee este código para solicitar su acceso al congreso.
          </p>
        </div>

        <p className="mt-4 text-[10px] text-zinc-400">
          Gobierno de México · SSPC — CIPSE XV
        </p>
      </div>

      <p className="text-[11px] text-muted print:hidden">
        Impresión directa: use “Imprimir QR de registro” y elija “Guardar como
        PDF” si desea archivarlo.
      </p>
    </main>
  );
}
