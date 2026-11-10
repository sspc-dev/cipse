"use client";

import { Button } from "@heroui/react";

export function PrintCredentialButton({
  label = "Imprimir credencial",
}: {
  label?: string;
}) {
  return (
    <Button
      variant="secondary"
      className="print:hidden"
      onPress={() => window.print()}
    >
      {label}
    </Button>
  );
}
