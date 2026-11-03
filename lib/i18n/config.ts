/** Idiomas soportados por el sitio público. El panel de administración es
 * exclusivamente en español y no usa estos valores. */

export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

/** Cookie donde se recuerda la elección de idioma. */
export const LANG_COOKIE = "cipse:locale";

/** Un año de vigencia para la preferencia de idioma. */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function hasLocale(value: string | undefined | null): value is Locale {
  return value === "es" || value === "en";
}

/** Devuelve un locale válido a partir de un valor arbitrario. */
export function normalizeLocale(value: string | undefined | null): Locale {
  return hasLocale(value) ? value : DEFAULT_LOCALE;
}

/** Ruta con prefijo de idioma. */
export function localizedPath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}
