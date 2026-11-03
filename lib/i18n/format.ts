/** Interpolación mínima de mensajes: reemplaza `{clave}` por su valor. */
export function formatMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Formato regional para fechas: es-MX para español, en-US para inglés. */
export function intlLocale(locale: string): string {
  return locale === "en" ? "en-US" : "es-MX";
}
