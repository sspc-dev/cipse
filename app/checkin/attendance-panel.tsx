"use client";

import { AlertCircleIcon, CheckIcon } from "@/app/register/icons";
import type {
  CheckinActionResponse,
  CheckinRecordSummary,
} from "@/lib/features/checkin/actions";
import { authenticateAdmin, registerAttendance } from "@/lib/features/checkin/actions";
import { Button, Input, Label, TextField } from "@heroui/react";
import { useState } from "react";

type AttendancePanelProps = {
  accessCode: string;
  adminSessionValid: boolean;
  delegado: CheckinRecordSummary;
  initialCheckedInAt: string | null;
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
}: AttendancePanelProps) {
  const [sessionValid, setSessionValid] = useState(adminSessionValid);
  const [adminKey, setAdminKey] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinActionResponse | null>(
    initialCheckedInAt
      ? {
          ok: true,
          alreadyCheckedIn: true,
          checkedInAt: initialCheckedInAt,
          record: delegado,
        }
      : null,
  );
  const [isPending, setIsPending] = useState(false);

  const isApproved = delegado.status === "Aprobada";
  const checkedInAt = result?.ok ? result.checkedInAt : null;

  async function submitAdminKey() {
    if (isPending) return;

    setIsPending(true);
    setKeyError(null);
    const outcome = await authenticateAdmin(adminKey);
    setIsPending(false);

    if (!outcome.ok) {
      setKeyError("Clave incorrecta. Intente de nuevo.");
      return;
    }
    setSessionValid(true);
  }

  async function submitAttendance() {
    if (isPending) return;

    setIsPending(true);
    const outcome = await registerAttendance(accessCode);
    setIsPending(false);
    setResult(outcome);
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
        <form className="flex flex-col gap-2" onSubmit={(event) => {
          event.preventDefault();
          void submitAdminKey();
        }}>
          <TextField isRequired name="admin-key" onChange={setAdminKey} value={adminKey}>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
              Clave de acreditación
            </Label>
            <Input
              aria-required
              autoComplete="current-password"
              className="mt-1.5 py-2.5 text-sm"
              placeholder="Clave del personal acreditador"
              type="password"
            />
          </TextField>
          <Button
            isDisabled={isPending || adminKey.trim().length === 0}
            isPending={isPending}
            onPress={() => void submitAdminKey()}
            type="submit"
            variant="primary"
          >
            Entrar
          </Button>
          {keyError ? (
            <p className="text-xs font-medium text-danger" role="alert">
              {keyError}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          {result?.ok ? (
            <p
              className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent-soft px-3.5 py-3 text-xs leading-relaxed text-accent-soft-foreground"
              role="status"
            >
              <CheckIcon className="mt-0.5 size-4 shrink-0" />
              {result.alreadyCheckedIn
                ? `La asistencia ya estaba registrada${
                    checkedInAt ? ` el ${formatCheckinTime(checkedInAt)}` : "."
                  }`
                : `Asistencia registrada${checkedInAt ? ` el ${formatCheckinTime(checkedInAt)}` : ""}`}
            </p>
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
            Registrar asistencia
          </Button>
        </div>
      )}
    </div>
  );
}
