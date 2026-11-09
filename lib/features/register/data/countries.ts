/**
 * Catálogo de países para el registro: códigos ISO 3166-1 alpha-2, nombre en
 * el idioma solicitado y bandera como emoji regional.
 *
 * Los nombres provienen de un dataset estático (country-names.generated.ts):
 * `Intl.DisplayNames` y `localeCompare` resuelven distinto según el ICU del
 * entorno (Node vs navegador) y causaban mismatch de hidratación.
 */

import { COUNTRY_NAMES } from "./country-names.generated";

export type CountryOption = {
  code: string;
  name: string;
  flag: string;
  /** Texto de búsqueda y `textValue` del ListBox. */
  label: string;
};

type CountryLanguage = keyof typeof COUNTRY_NAMES;

function intlTag(locale: string): CountryLanguage {
  return locale === "en" ? "en" : "es";
}

/** Indicadores regionales Unicode a partir del código alpha-2. */
function flagFromCode(code: string): string {
  return String.fromCodePoint(
    ...[...code].map(
      (letter) => 0x1f1e6 + letter.charCodeAt(0) - "A".charCodeAt(0),
    ),
  );
}

/**
 * Emoji de bandera si el valor es un código ISO alpha-2 válido; null para
 * valores legacy guardados con nombre completo.
 */
export function countryFlag(value: string): string | null {
  const code = value.trim();

  if (/^[A-Za-z]{2}$/.test(code)) {
    return flagFromCode(code.toUpperCase());
  }

  return null;
}

function countryName(code: string, tag: CountryLanguage): string {
  const entry = COUNTRY_NAMES[tag].find(([entryCode]) => entryCode === code);
  return entry ? entry[1] : code;
}

const optionsCache = new Map<CountryLanguage, CountryOption[]>();

/** Catálogo de países resuelto en el idioma solicitado. */
export function countryOptions(locale: string): CountryOption[] {
  const tag = intlTag(locale);
  const cached = optionsCache.get(tag);
  if (cached) return cached;

  // El dataset ya viene ordenado para el idioma de cada bloque.
  const options = COUNTRY_NAMES[tag].map(([code, name]) => ({
    code,
    name,
    flag: flagFromCode(code),
    label: `${flagFromCode(code)} ${name}`,
  }));

  optionsCache.set(tag, options);
  return options;
}

/**
 * Los registros nuevos guardan el código ISO; los antiguos guardaron el
 * nombre en español, que se muestra tal cual.
 */
export function countryDisplayName(value: string, locale: string): string {
  const code = value.trim();

  if (/^[A-Za-z]{2}$/.test(code)) {
    return countryName(code.toUpperCase(), intlTag(locale));
  }

  return value;
}
