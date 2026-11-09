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

/**
 * Idioma preferido del dispositivo a partir de `Accept-Language`.
 *
 * Respeta los pesos `q` (`en-US,en;q=0.9,es;q=0.8` → `en`) y, en caso de
 * empate, conserva el orden de la cabecera. Los idiomas no soportados y los
 * valores `q=0` se descartan; sin coincidencias se usa el idioma por defecto.
 */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale {
  if (!header) return DEFAULT_LOCALE;

  const preferences = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qualityParam = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      const quality = qualityParam
        ? Number.parseFloat(qualityParam.slice(2))
        : 1;

      return {
        language: tag.trim().slice(0, 2).toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter(({ language, quality }) => quality > 0 && hasLocale(language))
    .sort((a, b) => b.quality - a.quality);

  return preferences.length > 0
    ? normalizeLocale(preferences[0].language)
    : DEFAULT_LOCALE;
}
