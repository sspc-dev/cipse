/** Días del congreso para organizar el material multimedia. */
export const MULTIMEDIA_DAYS = [
  { value: 1, label: "Día 1" },
  { value: 2, label: "Día 2" },
  { value: 3, label: "Día 3" },
] as const;

export type MultimediaDay = (typeof MULTIMEDIA_DAYS)[number];

export function mediaDayLabel(day: number): string {
  return MULTIMEDIA_DAYS.find((item) => item.value === day)?.label ?? `Día ${day}`;
}
