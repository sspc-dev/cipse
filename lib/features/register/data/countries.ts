/**
 * Catálogo de países para el registro: códigos ISO 3166-1 alpha-2 con nombre
 * en español (Intl.DisplayNames) y bandera como emoji regional. Sin dataset
 * de nombres duplicado: el navegador resuelve la traducción.
 */

const ISO_ALPHA2_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT",
  "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI",
  "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY",
  "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
  "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK",
  "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL",
  "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR",
  "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
  "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS",
  "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW",
  "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP",
  "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
  "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM",
  "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF",
  "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW",
  "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

export type CountryOption = {
  code: string;
  name: string;
  flag: string;
  /** Texto de búsqueda y `textValue` del ListBox. */
  label: string;
};

function intlTag(locale: string): "en" | "es" {
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

function countryName(code: string, tag: "en" | "es"): string {
  try {
    return new Intl.DisplayNames([tag], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

const optionsCache = new Map<string, CountryOption[]>();

/** Catálogo de países resuelto en el idioma solicitado. */
export function countryOptions(locale: string): CountryOption[] {
  const tag = intlTag(locale);
  const cached = optionsCache.get(tag);
  if (cached) return cached;

  const options = ISO_ALPHA2_CODES.map((code) => {
    const name = countryName(code, tag);
    const flag = flagFromCode(code);

    return { code, name, flag, label: `${flag} ${name}` };
  }).sort((a, b) => a.name.localeCompare(b.name, tag));

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
