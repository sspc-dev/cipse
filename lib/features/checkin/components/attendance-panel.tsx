"use client";

import { AlertCircleIcon, CheckIcon, ClockIcon } from "@/app/register/icons";
import { AdminLoginForm } from "@/lib/features/auth/components/admin-login-form";
import type {
  CheckinActionResponse,
  CheckinRecordSummary,
} from "@/lib/features/checkin/actions";
import { registerAttendance } from "@/lib/features/checkin/actions";
import { Button } from "@heroui/react";
import { useState } from "react";

type AttendancePanelProps = {
  accessCode: string;
  adminSessionValid: boolean;
  delegado: CheckinRecordSummary;
  /** Hora de la asistencia de HOY (null si no se ha registrado el día actual). */
  initialCheckedInAt: string | null;
  initialAttendanceDays: number;
  onAttendanceRegistered?: () => void;
};

function formatCheckinTime(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}

const detailLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70";

function statusChipClass(status: string): string {
  return status === "Aprobada"
    ? "inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-soft-foreground"
    : "inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-ink";
}

export function AttendancePanel({
  accessCode,
  adminSessionValid,
  delegado,
  initialCheckedInAt,
  initialAttendanceDays,
  onAttendanceRegistered,
}: AttendancePanelProps) {
  const [sessionValid, setSessionValid] = useState(adminSessionValid);
  const [result, setResult] = useState<CheckinActionResponse | null>(
    initialCheckedInAt
      ? {
          ok: true,
          alreadyToday: true,
          attendedAt: initialCheckedInAt,
          attendanceDays: initialAttendanceDays,
          record: delegado,
        }
      : null,
  );
  const [isPending, setIsPending] = useState(false);

  const isApproved = delegado.status === "Aprobada";
  const attendedAt = result?.ok ? result.attendedAt : "";

  async function submitAttendance() {
    if (isPending) return;

    setIsPending(true);
    const outcome = await registerAttendance(accessCode);
    setIsPending(false);
    setResult(outcome);

    if (outcome.ok && !outcome.alreadyToday) {
      onAttendanceRegistered?.();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <dl className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/60 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <dt className={detailLabelClass}>Folio</dt>
          <dd className="font-mono text-sm font-semibold tracking-[0.08em] text-gold-ink">
            {delegado.folio}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className={detailLabelClass}>Delegado</dt>
          <dd className="text-sm font-semibold text-foreground">
            {delegado.name} {delegado.lastname}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className={detailLabelClass}>País</dt>
          <dd className="text-sm text-foreground">{delegado.country}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className={detailLabelClass}>Estado</dt>
          <dd className={statusChipClass(delegado.status)}>
            {delegado.status}
          </dd>
        </div>
      </dl>

      {!isApproved ? (
        <p
          className="flex items-start gap-2.5 rounded-xl border border-gold/25 bg-gold/10 px-3.5 py-3 text-xs leading-relaxed text-gold-ink"
          role="warning"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          La acreditación no está aprobada. Confirme con el responsable antes de
          registrar la asistencia.
        </p>
      ) : null}

      {!sessionValid ? (
        <>
          <AdminLoginForm onSuccess={() => setSessionValid(true)} />
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {result?.ok ? (
            result.alreadyToday ? (
              <p
                className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-3 text-xs leading-relaxed text-gold-ink"
                role="status"
              >
                <ClockIcon className="mt-0.5 size-4 shrink-0" />
                {`Ya fue registrada hoy${attendedAt ? ` a las ${formatCheckinTime(attendedAt)}` : ""} · `}
                <span className="font-semibold">
                  Día {result.attendanceDays} de asistencia
                </span>
              </p>
            ) : (
              <p
                className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent-soft px-3.5 py-3 text-xs leading-relaxed text-accent-soft-foreground"
                role="status"
              >
                <CheckIcon className="mt-0.5 size-4 shrink-0" />
                {`Asistencia del día registrada${attendedAt ? ` a las ${formatCheckinTime(attendedAt)}` : ""} · `}
                <span className="font-semibold">
                  Día {result.attendanceDays} de asistencia
                </span>
              </p>
            )
          ) : null}

          {result && !result.ok ? (
            <p
              className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-xs leading-relaxed text-danger"
              role="alert"
            >
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
              {result.message}
            </p>
          ) : null}

          <Button
            className="h-12 rounded-full text-sm font-semibold shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5 dark:shadow-black/40"
            isDisabled={isPending}
            isPending={isPending}
            onPress={() => void submitAttendance()}
            variant="primary"
          >
            Registrar asistencia de hoy
          </Button>
        </div>
      )}
    </div>
  );
}
