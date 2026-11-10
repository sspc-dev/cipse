"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { RegistrationsByCountry } from "@/lib/features/admin/datasource";
import { GlobeIcon } from "@/components/icons";
import { EChartsCanvas, type ChartClickParams } from "./echarts-canvas";
import { buildCountryOption } from "./chart-options";
import { listHref } from "../list-href";

const numberFormatter = new Intl.NumberFormat("es-MX");

/**
 * Distribución por país: barras horizontales apiladas de ECharts. Un click
 * en una barra filtra el listado por ese país (los "Otros" no filtran).
 */
export function CountryChartPanel({
  countries,
  activeCountry,
  search,
  activeAttendance,
  period,
}: {
  countries: RegistrationsByCountry[];
  activeCountry?: string;
  search?: string;
  activeAttendance?: "today" | "never";
  period?: number;
}) {
  const router = useRouter();
  const grandTotal = countries.reduce((sum, entry) => sum + entry.total, 0);
  const countryCount = countries.length;

  const buildOption = useCallback(
    () => buildCountryOption(countries, activeCountry),
    [countries, activeCountry],
  );

  const handleClick = useCallback(
    (params: ChartClickParams) => {
      const index = params.dataIndex;
      // El eje y es "inverse": el índice sigue correspondiendo al arreglo top.
      const entry = countries[index];
      if (!entry || index >= 8) return;
      router.push(
        listHref({
          search,
          attendance: activeAttendance,
          country: entry.country,
          period,
        }),
      );
    },
    [countries, router, search, activeAttendance, period],
  );

  if (countryCount === 0) {
    return null;
  }

  return (
    <div className="reveal glass rounded-2xl border border-border px-4 py-3.5 shadow-sm dark:border-white/10 [animation-delay:200ms]">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        <GlobeIcon className="size-3.5 text-muted/80" aria-hidden="true" />
        Distribución por país · {countryCount} país
        {countryCount === 1 ? "" : "es"} ·{" "}
        {numberFormatter.format(grandTotal)} registros
      </p>

      <EChartsCanvas
        ariaLabel={`Distribución de registros por país: ${countryCount} países, ${grandTotal} registros. Activar una barra filtra el listado.`}
        buildOption={buildOption}
        className="mt-2 h-60 w-full"
        onChartClick={handleClick}
        optionKey={`${countries.map((entry) => `${entry.country}:${entry.total}:${entry.attended}`).join("|")}:${activeCountry ?? ""}`}
      />

      <p className="mt-2 flex items-center gap-1.5 border-t border-border/60 pt-2 text-[10px] leading-relaxed text-muted/80">
        Click en una barra para filtrar el listado por país · tramo claro:
        con asistencia.
      </p>
    </div>
  );
}
