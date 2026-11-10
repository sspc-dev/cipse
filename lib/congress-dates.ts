/**
 * Fechas de negocio del congreso: punto único de conversión entre los
 * instantes UTC que almacena la BD y el día calendario local de México que
 * determina `attended_on` y los filtros "hoy".
 *
 * Nunca usar `CURDATE()`/`CURRENT_TIMESTAMP` de MySQL ni `new Date()` sin
 * conversión explícita para derivar el día de negocio: la sesión MySQL y el
 * host corren en UTC y producirían un desfase de 6 h con CDMX.
 *
 * El import relativo con extensión (no `@/lib/constants`) es intencional:
 * esta librería debe cargar también en `node --test` sin resolutor de alias.
 */
import { CONGRESS_TIME_ZONE } from "./constants.ts";

/** Fecha ISO YYYY-MM-DD de un instante en la zona del congreso (CDMX). */
export function isoDayInCongressTime(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CONGRESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Día de negocio actual: es el valor que deben usar `attended_on` y
 * cualquier filtro de "asistencia de hoy", en lugar de `CURDATE()`.
 */
export function congressTodayIso(): string {
  return isoDayInCongressTime(new Date());
}

/**
 * Desplaza un día ISO calendario en `days` días naturales. La aritmética
 * se hace sobre mediodías UTC para no saltar de fecha por diferencias de
 * huso (mismo criterio que las ventanas de las gráficas del panel).
 */
export function shiftCongressDay(isoDay: string, days: number): string {
  const [year, month, day] = isoDay.split("-").map(Number);
  const anchorUtcNoon = Date.UTC(year, month - 1, day, 12);
  return new Date(anchorUtcNoon + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
