import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getAdminSession } from "@/lib/features/auth/actions";
import {
  attendanceDaysFor,
  findAccreditationByCode,
  findAttendanceToday,
} from "@/lib/features/checkin/datasource";
import { accessCodeSchema } from "@/lib/features/checkin/schemas";
import { labelStatus } from "@/lib/features/checkin/status";
import { AttendancePanel } from "@/lib/features/checkin/components/attendance-panel";
import { CodeEntryForm } from "./code-entry-form";
import { ShieldIcon } from "@/app/register/icons";

export const metadata: Metadata = {
  title: "Registro de asistencia — CIPSE XV",
  description:
    "Verificación de credenciales y registro de asistencia para el personal acreditado del CIPSE XV.",
  robots: { index: false, follow: false },
};

const gridOverlayClass =
  "absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px]";

function CheckinSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="h-24 animate-pulse rounded-xl bg-foreground/[0.05]" />
      <div className="h-12 animate-pulse rounded-full bg-foreground/[0.05]" />
    </div>
  );
}

async function CheckinResolution({
  searchParams,
}: {
  searchParams: PageProps<"/checkin">["searchParams"];
}) {
  const { c: rawCode } = await searchParams;
  const accessCode = accessCodeSchema.safeParse(rawCode).data ?? null;

  const record =
    accessCode === null ? null : await findAccreditationByCode(accessCode);

  if (!record || accessCode === null) {    return (
      <div className="flex flex-col gap-4">
        <p
          className="rounded-xl border border-border/60 bg-background/60 px-3.5 py-3 text-xs leading-relaxed text-muted"
          role="status"
        >
          {rawCode
            ? "El código escaneado no corresponde a una acreditación válida."
            : "Escaneé la credencial QR del delegado o ingrese su código manualmente."}
        </p>
        <CodeEntryForm />
      </div>
    );
  }

  const [todayAttendance, attendanceDays] = await Promise.all([
    findAttendanceToday(record.id),
    attendanceDaysFor(record.id),
  ]);

  return (
    <AttendancePanel
      accessCode={accessCode}
      adminSessionValid={(await getAdminSession()) !== null}
      delegado={{
        folio: `CIPSE-${String(record.id).padStart(4, "0")}`,
        name: record.name,
        lastname: record.lastname,
        country: record.country,
        status: labelStatus(record.status),
      }}
      initialCheckedInAt={
        todayAttendance ? todayAttendance.toISOString() : null
      }
      initialAttendanceDays={attendanceDays}
    />
  );
}

export default function CheckinPage(props: PageProps<"/checkin">) {
  return (
    <main className="min-h-screen bg-background text-foreground dark:bg-[#070b11]">
      <div className="relative grid min-h-screen place-items-center px-4 py-10 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(85%_60%_at_50%_0%,rgba(29,75,68,0.22),transparent_70%)]" />
        <div className={gridOverlayClass} />

        <div className="relative z-10 w-full max-w-lg">
          <div className="card-enter overflow-hidden rounded-[22px] border border-border bg-surface/85 shadow-[0_30px_80px_-30px_rgba(16,24,29,0.35)] backdrop-blur-xl dark:border-white/10 dark:shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)]">
            <div className="h-1 w-full bg-linear-to-r from-tactical via-white to-guinda" />

            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-center gap-3">
                <Image
                  src="/imgs/SSPC.png"
                  alt="Sello de la Secretaría de Seguridad y Protección Ciudadana"
                  width={120}
                  height={120}
                  className="h-14 w-auto"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-ink/90">
                    CIPSE · México 2026
                  </p>
                  <h1 className="mt-1 flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
                    <ShieldIcon className="size-4 text-tactical-bright" />
                    Registro de asistencia
                  </h1>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Personal acreditador del congreso.
                  </p>
                </div>
              </div>

              <div className="my-6 h-px bg-border" />

              <Suspense fallback={<CheckinSkeleton />}>
                <CheckinResolution searchParams={props.searchParams} />
              </Suspense>
            </div>
          </div>

          <footer className="mt-6 text-center text-[11px] text-muted/60">
            Gobierno de México · SSPC — CIPSE XV · Acreditación
          </footer>
        </div>
      </div>
    </main>
  );
}
