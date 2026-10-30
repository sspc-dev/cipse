import { CONGRESS_TIME_ZONE } from "@/lib/constants";

/** Fecha ISO YYYY-MM-DD de un instante en la zona del congreso (CDMX). */
export function isoDayInCongressTime(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CONGRESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
