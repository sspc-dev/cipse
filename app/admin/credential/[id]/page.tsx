import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/features/auth/actions";
import { findAccreditationById } from "@/lib/features/admin/datasource";
import { labelStatus } from "@/lib/features/checkin/status";
import { folioLabel } from "@/lib/features/register/credential";
import { QrVisual } from "@/app/register/qr-visual";
import { PrintCredentialButton } from "../../print-credential-button";

export const metadata: Metadata = {
  title: "Credencial imprimible — CIPSE XV",
  description: "Credencial QR imprimible de un delegado del CIPSE XV.",
  robots: { index: false, follow: false },
};

export default function CredentialPrintPage(
  props: PageProps<"/admin/credential/[id]">,
) {
  return (
    <Suspense fallback={<CredentialSkeleton />}>
      <CredentialPrintContent params={props.params} />
    </Suspense>
  );
}

function CredentialSkeleton() {
  return (
    <main
      aria-hidden="true"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="flex h-[560px] w-full max-w-xs animate-pulse flex-col gap-4 rounded-2xl bg-foreground/5" />
    </main>
  );
}

async function CredentialPrintContent({
  params,
}: {
  params: PageProps<"/admin/credential/[id]">["params"];
}) {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin");
  }

  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId < 1) {
    notFound();
  }

  const accreditation = await findAccreditationById(numericId);

  if (!accreditation) {
    notFound();
  }

  const folio = folioLabel(accreditation.id);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-background px-4 py-10 print:block print:bg-white print:p-0">
      <div className="flex items-center gap-3 print:hidden">
        <a
          aria-label="Volver al panel de acreditación"
          className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent"
          href="/admin"
        >
          ← Panel
        </a>
        <PrintCredentialButton />
      </div>

      <div className="w-full max-w-xs rounded-2xl border border-border bg-white p-6 text-center shadow-[0_18px_50px_-24px_rgba(16,24,29,0.35)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <Image
          alt=""
          aria-hidden="true"
          height={120}
          src="/imgs/SSPC.png"
          width={120}
          className="mx-auto h-12 w-auto"
        />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          CIPSE XV · México 2026
        </p>
        <h1 className="mt-1 font-display text-lg font-bold tracking-tight text-zinc-900">
          Credencial de acceso
        </h1>

        <dl className="mt-4 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Delegado
            </dt>
            <dd className="font-semibold text-zinc-900">
              {accreditation.name} {accreditation.lastname}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Folio
            </dt>
            <dd className="font-mono font-semibold tracking-[0.12em] text-zinc-900">
              {folio}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Estado
            </dt>
            <dd className="font-semibold text-zinc-900">
              {labelStatus(accreditation.status)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
          <QrVisual
            credential={{
              id: accreditation.id,
              name: accreditation.name,
              lastname: accreditation.lastname,
              accessCode: accreditation.accessCode,
            }}
          />
          <p className="mt-3 font-mono text-[11px] font-semibold tracking-[0.14em] text-zinc-900">
            {accreditation.accessCode}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
            Presente este código en el acceso del congreso.
          </p>
        </div>

        <p className="mt-4 text-[10px] text-zinc-400">
          Gobierno de México · SSPC — CIPSE XV
        </p>
      </div>

      <p className="text-[11px] text-muted print:hidden">
        Impresión directa: use “Imprimir credencial” y elija “Guardar como PDF”
        si desea archivarla.
      </p>
    </main>
  );
}
