"use client";

import { RefreshIcon } from "@/app/register/icons";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      aria-label="Actualizar datos del panel"
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-soft-foreground disabled:opacity-60"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      type="button"
    >
      <RefreshIcon
        className={`size-3.5 ${isPending ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      Actualizar
    </button>
  );
}
