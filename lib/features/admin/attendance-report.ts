/**
 * Modelo puro del reporte de asistencia por día: tipos, agrupación y totales.
 *
 * No importa base de datos ni librerías de exportación para poder probarse
 * con `node --test` sin resolutor de alias ni conexión MySQL.
 */

export type AttendanceReportRow = {
  accreditationId: number;
  name: string;
  lastname: string;
  country: string;
  email: string;
  phone: string;
  /** Día de asistencia en formato YYYY-MM-DD (día de negocio CDMX). */
  attendedOn: string;
};

export type AttendanceReportDay = {
  /** Día en formato YYYY-MM-DD. */
  day: string;
  rows: AttendanceReportRow[];
};

export type AttendanceReportSummary = {
  /** Total de asistencias registradas (una por delegado y día). */
  total: number;
  /** Delegados distintos con al menos una asistencia. */
  uniqueDelegates: number;
  /** Días del congreso con al menos una asistencia. */
  daysWithAttendance: number;
};

/** Agrupa por día conservando el orden ascendente de fechas. */
export function groupAttendanceByDay(
  rows: AttendanceReportRow[],
): AttendanceReportDay[] {
  const byDay = new Map<string, AttendanceReportRow[]>();

  for (const row of rows) {
    const bucket = byDay.get(row.attendedOn);
    if (bucket) {
      bucket.push(row);
    } else {
      byDay.set(row.attendedOn, [row]);
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, dayRows]) => ({ day, rows: dayRows }));
}

export function summarizeAttendance(
  rows: AttendanceReportRow[],
): AttendanceReportSummary {
  const delegates = new Set<number>();
  const days = new Set<string>();

  for (const row of rows) {
    delegates.add(row.accreditationId);
    days.add(row.attendedOn);
  }

  return {
    total: rows.length,
    uniqueDelegates: delegates.size,
    daysWithAttendance: days.size,
  };
}

const dayFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Etiqueta editorial del día, sin depender del huso del servidor. */
export function reportDayLabel(isoDay: string): string {
  const label = dayFormatter.format(new Date(`${isoDay}T12:00:00.000Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Fecha calendario como instante UTC al mediodía (celda de fecha en Excel). */
export function reportDayDate(isoDay: string): Date {
  return new Date(`${isoDay}T12:00:00.000Z`);
}
