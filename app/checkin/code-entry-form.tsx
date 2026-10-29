"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CodeEntryForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = code.trim();
        if (normalized.length < 16) return;

        startTransition(() => {
          router.push(`/checkin?c=${encodeURIComponent(normalized)}`);
        });
      }}
    >
      <TextField
        className="flex-1"
        isDisabled={isPending}
        name="code"
        onChange={setCode}
        value={code}
      >
        <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
          Código de credencial
        </Label>
        <Input
          aria-required
          className="mt-1.5 py-2.5 text-sm"
          placeholder="Código impreso bajo el QR"
          type="text"
        />
      </TextField>
      <Button
        className="shrink-0"
        isDisabled={isPending || code.trim().length < 16}
        isPending={isPending}
        type="submit"
      >
        Buscar
      </Button>
    </form>
  );
}
