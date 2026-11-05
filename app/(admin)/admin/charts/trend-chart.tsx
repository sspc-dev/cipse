"use client";

import { useCallback } from "react";
import type { RegistrationsByDay } from "@/lib/features/admin/datasource";
import { TrendIcon } from "@/components/icons";
import { EChartsCanvas } from "./echarts-canvas";
import { buildTrendOption } from "./chart-options";
import { PeriodFilter } from "./period-filter";

const numberFormatter = new Intl.NumberFormat("es-MX");

/**
 * Panel de tendencia de altas: encabezado con selector de periodo y gráfica
 * ECharts interactiva (zoom, tooltip, punto máximo resaltado en dorado).
 */
export function TrendChartPanel({
  days,
  period,
}: {
  days: RegistrationsByDay[];
  period: number;
}) {
  const total = days.reduce((sum, entry) => sum + entry.count, 0);
  const peak = days.reduce(
    (best, entry) => (entry.count > best.count ? entry : best),
    days[0],
  );

  const buildOption = useCallback(() => buildTrendOption(days), [days]);

  if (total === 0) {
    return (
      <div className="reveal glass rounded-2xl border border-border px-4 py-3.5 shadow-sm dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <TrendIcon className="size-3.5 text-muted/80" aria-hidden="true" />
            Tendencia de registros
          </p>
          <PeriodFilter period={period} />
        </div>
        <div
          className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-foreground/[0.02] px-4 py-10 text-center"
          role="status"
        >
          <span className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-foreground/5 text-muted">
            <TrendIcon className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-foreground">
            Aún sin registros
          </p>
          <p className="max-w-64 text-xs leading-relaxed text-muted">
            La curva de altas aparecerá aquí cuando los participantes se
            acrediten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal glass rounded-2xl border border-border px-4 py-3.5 shadow-sm dark:border-white/10 [animation-delay:150ms]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <TrendIcon className="size-3.5 text-muted/80" aria-hidden="true" />
          Tendencia de registros · últimos {days.length} días
        </p>
        <PeriodFilter period={period} />
      </div>

      <EChartsCanvas
        ariaLabel={`Tendencia de altas: ${numberFormatter.format(total)} en ${days.length} días, máximo de ${peak.count}`}
        buildOption={buildOption}
        className="mt-2 h-56 w-full"
        optionKey={days}
      />

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border/60 pt-2.5 text-[10px] text-muted/85">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-tactical-bright"
          />
          {numberFormatter.format(total)} altas en {days.length} días
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
          Pico: {numberFormatter.format(peak.count)} · {peak.day}
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[10px] leading-relaxed text-muted/80">
        Desplazamiento horizontal o rueda para acercar · punto dorado: máximo
        del periodo.
      </p>
    </div>
  );
}
