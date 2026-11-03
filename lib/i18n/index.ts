import { es, type Dictionary } from "./dictionaries/es";
import { en } from "./dictionaries/en";
import type { Locale } from "./config";

export type { Dictionary };
export { es, en };

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export * from "./config";
export * from "./format";
