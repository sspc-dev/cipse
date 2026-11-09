"use client";

import { Button } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import { GlobeIcon } from "@/components/icons";
import { type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({
  locale,
  label,
  targetLabel,
  className,
}: {
  locale: Locale;
  /** Texto accesible del botón. */
  label: string;
  /** Nombre del idioma al que se cambiará. */
  targetLabel: string;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const target: Locale = locale === "es" ? "en" : "es";

  function switchLocale() {
    const segments = pathname.split("/");

    if (segments[1] === locale || segments[1] === target) {
      segments[1] = target;
    } else {
      segments.splice(1, 0, target);
    }

    const nextPath = segments.join("/") || `/${target}`;
    // La cookie la fija el proxy en la siguiente petición, con HttpOnly y
    // Secure; escribirla aquí la duplicaría sin esas protecciones.
    document.documentElement.lang = target;
    router.push(nextPath);
  }

  return (
    <Button
      aria-label={label}
      className={className}
      onPress={switchLocale}
      size="sm"
      variant="secondary"
    >
      <GlobeIcon className="size-3.5" aria-hidden="true" />
      {targetLabel}
    </Button>
  );
}
