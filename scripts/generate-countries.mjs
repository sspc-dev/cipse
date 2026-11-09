/**
 * Genera lib/features/register/data/country-names.generated.ts
 *
 * `Intl.DisplayNames` y `localeCompare` devuelven resultados distintos según
 * el ICU del entorno (Node vs navegador), lo que rompía la hidratación del
 * campo de países. Este script congela nombres y orden con el ICU completo de
 * Node en un dataset estático que servidor y cliente comparten.
 *
 * Ejecutar tras cambiar la lista de códigos:
 *   node scripts/generate-countries.mjs
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
];

const LANGUAGES = ["es", "en"];
const OUTPUT_PATH = fileURLToPath(
  new URL("../lib/features/register/data/country-names.generated.ts", import.meta.url),
);

function countryName(code, tag) {
  const name = new Intl.DisplayNames([tag], { type: "region" }).of(code);
  if (!name || name === code) {
    throw new Error(`Sin nombre para ${code} en "${tag}"`);
  }
  return name;
}

const escape = (value) => value.replaceAll("'", "\\'");
const tuple = ([code, name]) => `  ["${code}", "${escape(name)}"]`;

const blocks = LANGUAGES.map((tag) => {
  const entries = ISO_ALPHA2_CODES.map((code) => [code, countryName(code, tag)])
    .sort(([, a], [, b]) => a.localeCompare(b, tag))
    .map(tuple);

  return `${tag}: [\n${entries.join(",\n")}\n]`;
});

const output = `/**
 * GENERADO — no editar a mano.
 * Regenerar con: node scripts/generate-countries.mjs
 *
 * Nombres de países ISO 3166-1 alpha-2 en es/en, congelados con el ICU de
 * Node para que servidor y cliente rendericen exactamente lo mismo (ver
 * scripts/generate-countries.mjs). Las tuplas ya vienen ordenadas para el
 * idioma de cada bloque.
 */

export const COUNTRY_NAMES = {
${blocks.join(",\n")},
} as const;
`;

writeFileSync(OUTPUT_PATH, output);
console.log(
  `Generado ${OUTPUT_PATH} (${ISO_ALPHA2_CODES.length} países × ${LANGUAGES.length} idiomas)`,
);
