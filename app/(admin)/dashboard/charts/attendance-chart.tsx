"use client";

import type { AttendanceByDay } from "@/lib/features/admin/datasource";
import { CalendarIcon } from "@/components/icons";
import { EChartsCanvas } from "./echarts-canvas";
import { buildAttendanceOption } from "./chart-options";

const numberFormatter = new Intl.NumberFormat("es-MX");

/** Panel de asistencia por día: barras ECharts con el día de hoy en dorado. */
export function AttendanceChartPanel({
  days,
  todayIso,
}: {
  days: AttendanceByDay[];
  todayIso: string;
}) {
  const total = days.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="reveal glass rounded-2xl border border-border px-4 py-3.5 shadow-sm dark:border-white/10 [animation-delay:150ms]">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        <CalendarIcon className="size-3.5 text-muted/80" aria-hidden="true" />
        Asistencia por día · últimos {days.length} días
      </p>

      {total === 0 ? (
        <div
          className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-foreground/[0.02] px-4 py-10 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-foreground">
            Sin asistencias en el periodo
          </p>
          <p className="max-w-64 text-xs leading-relaxed text-muted">
            Las barras aparecerán aquí cuando se registre la asistencia de los
            participantes.
          </p>
        </div>
      ) : (
        <EChartsCanvas
          ariaLabel={`Asistencia por día: ${numberFormatter.format(total)} en ${days.length} días`}
          buildOption={() => buildAttendanceOption(days, todayIso)}
          className="mt-2 h-56 w-full"
          optionKey={days}
        />
      )}

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
        <p className="text-[10px] text-muted/80">
          Total del periodo:{" "}
          <span className="font-mono font-semibold tabular-nums text-muted">
            {numberFormatter.format(total)}
          </span>{" "}
          asistencias · barra dorada: hoy
        </p>
        <a
          className="text-[10px] font-semibold text-muted transition-colors hover:text-accent-soft-foreground"
          href="#reportes"
        >
          Generar reporte
        </a>
      </div>
    </div>
  );
}
