"use client";

import { Button, Calendar, I18nProvider, Spinner } from "@heroui/react";
import {
  toCalendarDate,
  today,
  type CalendarDate,
} from "@internationalized/date";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import type { AttendanceByDay } from "@/lib/features/admin/datasource";
import { reportDayLabel } from "@/lib/features/admin/attendance-report";
import { DownloadIcon } from "@/components/icons";

const numberFormatter = new Intl.NumberFormat("es-MX");

/** Descarga el XLSX como blob y lanza el guardado sin abandonar la página. */
async function downloadAttendanceReport(day?: string): Promise<void> {
  const response = await fetch(
    day ? `/api/reports/attendance?day=${day}` : "/api/reports/attendance",
  );

  if (!response.ok) {
    const message = (await response.text()).trim();

    throw new Error(message || "No fue posible generar el reporte.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = day
    ? `cipse-xv-asistencia-${day}.xlsx`
    : "cipse-xv-asistencia-consolidado.xlsx";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

const cellClassName =
  "rounded-full text-xs data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[today=true]:bg-accent-soft data-[today=true]:text-accent-soft-foreground data-[selected=true]:data-[today=true]:bg-accent data-[selected=true]:data-[today=true]:text-accent-foreground data-[outside-month=true]:text-muted/40";

/**
 * Generador del reporte XLSX de asistencia: calendario con atajos Hoy/Ayer,
 * marcas en los días con asistencias del periodo visible y descarga con
 * retroalimentación vía toast.
 */
export function AttendanceReportPanel({ days }: { days: AttendanceByDay[] }) {
  const todayDate = useMemo(() => today(CONGRESS_TIME_ZONE), []);
  const [selected, setSelected] = useState<CalendarDate | null>(todayDate);
  const [pending, setPending] = useState<"day" | "all" | null>(null);

  const attendanceDays = useMemo(
    () => new Set(days.map((entry) => entry.day)),
    [days],
  );
  const countByDay = useMemo(
    () => new Map(days.map((entry) => [entry.day, entry.count])),
    [days],
  );

  const selectedDay = selected?.toString() ?? null;
  const windowStart = days[0]?.day;
  const selectedCount =
    selectedDay && windowStart && selectedDay >= windowStart
      ? (countByDay.get(selectedDay) ?? 0)
      : null;

  const isTodaySelected = selectedDay === todayDate.toString();
  const isYesterdaySelected =
    selectedDay === todayDate.subtract({ days: 1 }).toString();

  function handleDownload(kind: "day" | "all") {
    if (pending) return;

    const day = kind === "day" ? (selectedDay ?? undefined) : undefined;

    if (kind === "day" && !day) return;

    setPending(kind);
    toast.promise(downloadAttendanceReport(day), {
      loading: "Generando reporte…",
      success: "Reporte descargado.",
      error: (error) =>
        error instanceof Error
          ? error.message
          : "No fue posible generar el reporte.",
      finally: () => setPending(null),
    });
  }

  return (
    <div className="reveal glass grid gap-4 rounded-2xl border border-border p-4 shadow-sm dark:border-white/10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Selecciona un día
          </p>
          <div
            aria-label="Atajos de fecha"
            className="flex items-center gap-1"
            role="group"
          >
            <Button
              className="h-6 min-w-0 rounded-full px-2 text-[10px] font-semibold"
              onPress={() => setSelected(todayDate)}
              size="sm"
              variant={isTodaySelected ? "secondary" : "ghost"}
            >
              Hoy
            </Button>
            <Button
              className="h-6 min-w-0 rounded-full px-2 text-[10px] font-semibold"
              onPress={() => setSelected(todayDate.subtract({ days: 1 }))}
              size="sm"
              variant={isYesterdaySelected ? "secondary" : "ghost"}
            >
              Ayer
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface-secondary/40 p-2">
          <I18nProvider locale="es-MX">
            <Calendar
              aria-label="Seleccionar el día del reporte"
              className="w-full"
              maxValue={todayDate}
              value={selected}
              onChange={(value) =>
                setSelected(value ? toCalendarDate(value) : null)
              }
            >
              <Calendar.Header className="px-1 pb-2">
                <Calendar.Heading className="text-xs font-semibold text-foreground" />
                <Calendar.NavButton
                  className="text-muted hover:bg-foreground/5"
                  slot="previous"
                />
                <Calendar.NavButton
                  className="text-muted hover:bg-foreground/5"
                  slot="next"
                />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => (
                    <Calendar.HeaderCell className="pb-1 text-[10px] font-semibold uppercase text-muted">
                      {day}
                    </Calendar.HeaderCell>
                  )}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(date) => (
                    <Calendar.Cell className={cellClassName} date={date}>
                      {(values) => (
                        <>
                          {values.formattedDate}
                          {attendanceDays.has(values.date.toString()) ? (
                            <Calendar.CellIndicator className="bg-gold" />
                          ) : null}
                        </>
                      )}
                    </Calendar.Cell>
                  )}
                </Calendar.GridBody>
              </Calendar.Grid>
            </Calendar>
          </I18nProvider>
        </div>

        <p className="flex items-center gap-1.5 text-[10px] leading-relaxed text-muted/80">
          <span
            aria-hidden="true"
            className="inline-block size-1.5 shrink-0 rounded-full bg-gold"
          />
          El punto indica días con asistencias registradas en el periodo visible
          ({days.length} días).
        </p>
      </div>

      <div className="flex flex-col gap-3 md:border-s md:border-border/60 md:ps-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Día seleccionado
          </p>
          <p className="font-display text-lg font-bold tracking-tight text-foreground">
            {selectedDay ? reportDayLabel(selectedDay) : "Ninguno"}
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {selectedCount === null
              ? "—"
              : numberFormatter.format(selectedCount)}
          </span>
          <span className="text-xs text-muted">asistencias registradas</span>
        </div>

        <p className="text-[11px] leading-relaxed text-muted">
          {selectedCount === null
            ? "El día está fuera del periodo visible del panel; el archivo incluye el detalle completo de ese día."
            : "El archivo Excel incluye nombre, país, correo y teléfono de cada participante."}
        </p>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Button
            className="h-9 w-full justify-center gap-2 rounded-full bg-accent text-xs font-semibold text-accent-foreground sm:w-auto sm:px-4"
            isDisabled={!selectedDay || pending !== null}
            isPending={pending === "day"}
            onPress={() => handleDownload("day")}
            size="sm"
          >
            {({ isPending }) => (
              <>
                {isPending ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <DownloadIcon className="size-3.5" aria-hidden="true" />
                )}
                {isPending ? "Generando…" : "Descargar día seleccionado"}
              </>
            )}
          </Button>

          <Button
            className="h-9 w-full justify-center gap-2 rounded-full text-xs font-semibold sm:w-auto sm:px-4"
            isDisabled={pending !== null}
            isPending={pending === "all"}
            onPress={() => handleDownload("all")}
            size="sm"
            variant="outline"
          >
            {({ isPending }) => (
              <>
                {isPending ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <DownloadIcon className="size-3.5" aria-hidden="true" />
                )}
                {isPending ? "Generando…" : "Descargar todos los días"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
