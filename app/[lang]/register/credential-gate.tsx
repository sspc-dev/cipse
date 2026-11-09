"use client";

import { Button } from "@heroui/react";
import { useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { RegisterForm } from "./register-form";
import { QrCredentialCard, type CredentialData } from "./register-success";

/*
 * La credencial vive únicamente en memoria: no se persiste en localStorage
 * para no exponer nombre, correo y código de acceso en el navegador (alertas
 * ZAP). Quien necesite recuperar su QR puede usar /checkin con su código de
 * acceso.
 */
export function CredentialGate({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  const [credential, setCredential] = useState<CredentialData | null>(null);

  if (credential) {
    return (
      <div className="flex flex-col items-center gap-4">
        <QrCredentialCard
          credential={credential}
          dictionary={dictionary}
          locale={locale}
        />
        <Button
          aria-label={dictionary.register.success.registerAnotherAria}
          className="h-11 rounded-full text-sm font-semibold"
          onPress={() => setCredential(null)}
          variant="ghost"
        >
          {dictionary.register.success.registerAnother}
        </Button>
      </div>
    );
  }

  return (
    <RegisterForm dictionary={dictionary} locale={locale} onSuccess={setCredential} />
  );
}
