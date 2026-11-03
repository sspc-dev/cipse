"use client";

import { Button } from "@heroui/react";

export function PrintCredentialButton() {
  return (
    <Button
      variant="secondary"
      className="print:hidden"
      onPress={() => window.print()}
    >
      Imprimir credencial
    </Button>
  );
}
