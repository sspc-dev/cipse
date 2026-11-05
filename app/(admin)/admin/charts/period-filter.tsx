"use client";

import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PERIOD_OPTIONS = [
  { id: "7", label: "7 días" },
  { id: "14", label: "14 días" },
  { id: "30", label: "30 días" },
] as const;

/**
 * Selector de periodo de las gráficas (7 / 14 / 30 días) como parámetro de
 * URL: el servidor vuelve a consultar y todas las gráficas se actualizan.
 */
export function PeriodFilter({ period }: { period: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeId = String(
    PERIOD_OPTIONS.some((option) => option.id === String(period))
      ? period
      : 14,
  );

  return (
    <ToggleButtonGroup
      aria-label="Periodo de las gráficas"
      className="rounded-full border border-border bg-surface/60 p-0.5 dark:border-white/10"
      disallowEmptySelection
      onSelectionChange={(keys) => {
        const next = [...keys][0];
        if (!next) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set("period", String(next));
        router.push(`${pathname}?${params.toString()}`);
      }}
      selectedKeys={new Set([activeId])}
      selectionMode="single"
      size="sm"
    >
      {PERIOD_OPTIONS.map((option) => (
        <ToggleButton
          className="rounded-full px-2.5 text-[10px] font-semibold text-muted data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
          id={option.id}
          key={option.id}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
