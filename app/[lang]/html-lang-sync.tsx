"use client";

import { useEffect } from "react";

/*
 * El layout raíz no conoce el locale (está por encima del segmento `[lang]`),
 * así que el atributo `lang` del documento se sincroniza al hidratar. Es
 * idempotente: una árbol oculto por Activity puede reactivarse y re-ejecutar
 * el efecto sin efectos secundarios.
 */
export function HtmlLangSync({ lang }: { lang: string }) {
  useEffect(() => {
    if (document.documentElement.lang !== lang) {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return null;
}
