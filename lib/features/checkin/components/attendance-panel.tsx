"use client";

import { AlertCircleIcon, CheckIcon, ClockIcon } from "@/components/icons";
import { AdminLoginForm } from "@/lib/features/auth/components/admin-login-form";
import type {
  CheckinActionResponse,
  CheckinRecordSummary,
} from "@/lib/features/checkin/actions";
import { registerAttendance } from "@/lib/features/checkin/actions";
import { countryDisplayName } from "@/lib/features/register/data/countries";
import {
  formatMessage,
  intlLocale,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";
import { Button } from "@heroui/react";
import { useState } from "react";

type AttendancePanelProps = {
  accessCode: string;
  adminSessionValid: boolean;
  delegado: CheckinRecordSummary;
  dictionary: Dictionary;
  /** Hora de la asistencia de HOY (null si no se ha registrado el día actual). */
  initialCheckedInAt: string | null;
  initialAttendanceDays: number;
  /** Idioma de la interfaz, para textos y formato regional. */
  locale: Locale;
};

function formatCheckinTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}

const detailLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70";

export function AttendancePanel({
  accessCode,
  adminSessionValid,
  delegado,
  dictionary,
  initialCheckedInAt,
  initialAttendanceDays,
  locale,
}: AttendancePanelProps) {
  const copy = dictionary.checkin;
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

  const attendedAt = result?.ok ? result.attendedAt : "";

  async function submitAttendance() {
    if (isPending) return;

    setIsPending(true);
    const outcome = await registerAttendance(accessCode, locale);
    setIsPending(false);
    setResult(outcome);
  }

  return (
    <div className="flex flex-col gap-5">
      <dl className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/60 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <dt className={detailLabelClass}>{copy.folio}</dt>
          <dd className="font-mono text-sm font-semibold tracking-[0.08em] text-gold-ink">
            {delegado.folio}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className={detailLabelClass}>{copy.delegate}</dt>
          <dd className="text-sm font-semibold text-foreground">
            {delegado.name} {delegado.lastname}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className={detailLabelClass}>{copy.country}</dt>
          <dd className="text-sm text-foreground">
            {countryDisplayName(delegado.country, locale)}
          </dd>
        </div>
      </dl>

      {!sessionValid ? (
        <AdminLoginForm onSuccess={() => setSessionValid(true)} />
      ) : (
        <div className="flex flex-col gap-2">
          {result?.ok ? (
            result.alreadyToday ? (
              <p
                className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-3 text-xs leading-relaxed text-gold-ink"
                role="status"
              >
                <ClockIcon className="mt-0.5 size-4 shrink-0" />
                {formatMessage(copy.alreadyToday, {
                  time: attendedAt
                    ? formatMessage(copy.timeSuffix, {
                        time: formatCheckinTime(attendedAt, locale),
                      })
                    : "",
                })}
                <span className="font-semibold">
                  {formatMessage(copy.attendanceDays, {
                    n: result.attendanceDays,
                  })}
                </span>
              </p>
            ) : (
              <p
                className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent-soft px-3.5 py-3 text-xs leading-relaxed text-accent-soft-foreground"
                role="status"
              >
                <CheckIcon className="mt-0.5 size-4 shrink-0" />
                {formatMessage(copy.registeredToday, {
                  time: attendedAt
                    ? formatMessage(copy.timeSuffix, {
                        time: formatCheckinTime(attendedAt, locale),
                      })
                    : "",
                })}
                <span className="font-semibold">
                  {formatMessage(copy.attendanceDays, {
                    n: result.attendanceDays,
                  })}
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
            {copy.registerAttendance}
          </Button>
        </div>
      )}
    </div>
  );
}
