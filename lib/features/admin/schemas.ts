import { z } from "zod";

export const adminListQuerySchema = z.object({
  p: z.coerce.number().int().min(1).default(1),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined)),
  /** Filtro exacto por país: valor almacenado (código ISO o nombre legacy). */
  country: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),
  /** Filtro de asistencia basado en attendance_records. */
  attendance: z.enum(["today", "never"]).optional(),
  /** Ventana de días de las gráficas (7 / 14 / 30); fuera de rango → 14. */
  period: z.coerce.number().int().min(7).max(90).catch(14),
});

export type AdminListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  attendance?: "today" | "never";
};

export type ChartPeriod = 7 | 14 | 30;

export const DEFAULT_CHART_PERIOD: ChartPeriod = 14;

/** Normaliza el parámetro `period` a una ventana soportada por los selectores. */
export function normalizeChartPeriod(value: number): ChartPeriod {
  if (value === 7 || value === 14 || value === 30) return value;
  if (value < 14) return 7;
  if (value > 14) return 30;
  return DEFAULT_CHART_PERIOD;
}

/**
 * Parámetro del reporte XLSX de asistencia: `day` es un día calendario
 * YYYY-MM-DD opcional. Sin día se genera el consolidado de todos los días.
 */
export const attendanceReportQuerySchema = z.object({
  day: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.iso.date().optional(),
  ),
});
