import type { EChartsOption } from "echarts";
import type {
  AttendanceByDay,
  RegistrationsByCountry,
  RegistrationsByDay,
} from "@/lib/features/admin/datasource";
import { countryDisplayName } from "@/lib/features/register/data/countries";

type Palette = {
  tactical: string;
  tacticalBright: string;
  gold: string;
  muted: string;
  foreground: string;
  accent: string;
  border: string;
};

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/** Lee los tokens del tema vigente para pintar las series de ECharts. */
export function getChartPalette(): Palette {
  return {
    tactical: cssVar("--color-tactical", "#1d4b44"),
    tacticalBright: cssVar("--color-tactical-bright", "#2f7d70"),
    gold: cssVar("--color-gold", "#c59b27"),
    muted: cssVar("--muted", "#94a3b8"),
    foreground: cssVar("--foreground", "#f4f6f7"),
    accent: cssVar("--accent", "#1d4b44"),
    border: cssVar("--border", "rgba(255,255,255,0.12)"),
  };
}

const numberFormatter = new Intl.NumberFormat("es-MX");

function baseTooltip(palette: Palette) {
  return {
    trigger: "axis" as const,
    backgroundColor: "rgba(6, 9, 14, 0.92)",
    borderColor: palette.border,
    borderWidth: 1,
    padding: [8, 10] as [number, number],
    textStyle: { color: "#f4f6f7", fontSize: 11 },
    axisPointer: { type: "line" as const, lineStyle: { opacity: 0.3 } },
  };
}

function baseGrid() {
  return { left: 8, right: 14, top: 18, bottom: 40, containLabel: true };
}

function axisLabelStyle(palette: Palette) {
  return { color: palette.muted, fontSize: 10 };
}

function splitLineStyle(palette: Palette) {
  return { lineStyle: { color: palette.foreground, opacity: 0.07 } };
}

function formatDayLabel(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(`${iso}T12:00:00Z`));
}

/** Tendencia de altas: línea suave con área, dataZoom y punto de hoy. */
export function buildTrendOption(days: RegistrationsByDay[]): EChartsOption {
  const palette = getChartPalette();
  const labels = days.map((entry) => formatDayLabel(entry.day));
  const values = days.map((entry) => entry.count);
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return { series: [] };
  }

  return {
    grid: baseGrid(),
    tooltip: {
      ...baseTooltip(palette),
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const first = list[0];
        if (!first) return "";
        return `<strong>${first.name}</strong><br/>${numberFormatter.format(Number(first.value))} altas`;
      },
    },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: palette.border } },
      axisTick: { show: false },
      axisLabel: { ...axisLabelStyle(palette), hideOverlap: true },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { ...axisLabelStyle(palette), formatter: (v: number) => String(v) },
      splitLine: splitLineStyle(palette),
    },
    dataZoom: [
      { type: "inside", zoomOnMouseWheel: true, moveOnMouseWheel: false },
      {
        type: "slider",
        height: 14,
        bottom: 6,
        borderColor: "transparent",
        backgroundColor: "rgba(255,255,255,0.04)",
        fillerColor: "rgba(47,125,112,0.25)",
        handleStyle: { color: palette.tacticalBright },
        moveHandleStyle: { color: palette.tacticalBright },
        textStyle: { color: palette.muted, fontSize: 9 },
        dataBackground: {
          lineStyle: { color: palette.tacticalBright, opacity: 0.4 },
          areaStyle: { color: palette.tacticalBright, opacity: 0.12 },
        },
        selectedDataBackground: {
          lineStyle: { color: palette.tacticalBright },
          areaStyle: { color: palette.tacticalBright, opacity: 0.25 },
        },
      },
    ],
    series: [
      {
        type: "line",
        name: "Altas",
        data: values,
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        showSymbol: values.length <= 14,
        lineStyle: { width: 2, color: palette.tacticalBright },
        itemStyle: { color: palette.tacticalBright },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(47,125,112,0.4)" },
              { offset: 1, color: "rgba(47,125,112,0.02)" },
            ],
          },
        },
        markPoint: {
          symbol: "circle",
          symbolSize: 8,
          label: { show: false },
          itemStyle: { color: palette.gold, borderColor: "transparent" },
          data: [{ type: "max", name: "Máximo" }],
        },
      },
    ],
  };
}

/** Asistencia por día: barras con el día de hoy resaltado en dorado. */
export function buildAttendanceOption(
  days: AttendanceByDay[],
  todayIso: string,
): EChartsOption {
  const palette = getChartPalette();
  const labels = days.map((entry) => formatDayLabel(entry.day));
  const values = days.map((entry) => entry.count);
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return { series: [] };
  }

  return {
    grid: baseGrid(),
    tooltip: {
      ...baseTooltip(palette),
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const first = list[0];
        if (!first) return "";
        const index = first.dataIndex;
        const iso = days[index]?.day ?? "";
        const isToday = iso === todayIso;
        return `<strong>${first.name}${isToday ? " · hoy" : ""}</strong><br/>${numberFormatter.format(Number(first.value))} asistencias`;
      },
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: { lineStyle: { color: palette.border } },
      axisTick: { show: false },
      axisLabel: { ...axisLabelStyle(palette), hideOverlap: true },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { ...axisLabelStyle(palette) },
      splitLine: splitLineStyle(palette),
    },
    series: [
      {
        type: "bar",
        name: "Asistencias",
        data: days.map((entry) => ({
          value: entry.count,
          itemStyle: {
            color:
              entry.day === todayIso
                ? palette.gold
                : palette.tacticalBright,
            borderRadius: [4, 4, 0, 0],
            opacity: entry.day === todayIso ? 1 : 0.75,
          },
        })),
        barMaxWidth: 28,
      },
    ],
  };
}

/**
 * Distribución por país: barras horizontales apiladas (con/sin asistencia).
 * El click en una barra filtra el listado por ese país.
 */
export function buildCountryOption(
  countries: RegistrationsByCountry[],
  activeCountry?: string,
): EChartsOption {
  const palette = getChartPalette();

  if (countries.length === 0) {
    return { series: [] };
  }

  const top = countries.slice(0, 8);
  const rest = countries.slice(8);
  const labels = top.map((entry) => {
    const name = countryDisplayName(entry.country, "es");
    const isActive = entry.country === activeCountry;
    return `${isActive ? "▸ " : ""}${name}`;
  });
  const attended = top.map((entry) => entry.attended);
  const pending = top.map((entry) => Math.max(0, entry.total - entry.attended));

  if (rest.length > 0) {
    const restTotal = rest.reduce((sum, entry) => sum + entry.total, 0);
    const restAttended = rest.reduce((sum, entry) => sum + entry.attended, 0);
    labels.push(`Otros (${rest.length})`);
    attended.push(restAttended);
    pending.push(Math.max(0, restTotal - restAttended));
  }

  return {
    grid: { left: 8, right: 40, top: 8, bottom: 34, containLabel: true },
    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: palette.muted, fontSize: 10 },
      data: ["Con asistencia", "Sin asistencia"],
    },
    tooltip: {
      ...baseTooltip(palette),
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        if (list.length === 0) return "";
        const name = list[0]?.name ?? "";
        const lines = list.map((item) => {
          const label = item.seriesName ?? "";
          return `${item.marker ?? ""}${label}: <strong>${numberFormatter.format(Number(item.value))}</strong>`;
        });
        return `<strong>${name}</strong><br/>${lines.join("<br/>")}`;
      },
    },
    xAxis: {
      type: "value",
      axisLabel: { ...axisLabelStyle(palette) },
      splitLine: splitLineStyle(palette),
    },
    yAxis: {
      type: "category",
      data: labels,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        ...axisLabelStyle(palette),
        width: 118,
        overflow: "truncate" as const,
      },
    },
    series: [
      {
        name: "Con asistencia",
        type: "bar",
        stack: "total",
        barMaxWidth: 16,
        itemStyle: { color: palette.tacticalBright, borderRadius: 0 },
        data: attended,
      },
      {
        name: "Sin asistencia",
        type: "bar",
        stack: "total",
        barMaxWidth: 16,
        itemStyle: {
          color: palette.tactical,
          opacity: 0.45,
          borderRadius: [0, 4, 4, 0],
        },
        data: pending,
      },
    ],
  };
}
