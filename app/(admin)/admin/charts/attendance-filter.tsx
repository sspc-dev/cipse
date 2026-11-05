"use client";

import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ATTENDANCE_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "today", label: "Hoy" },
  { id: "never", label: "Sin asistencia" },
] as const;

type AttendanceValue = (typeof ATTENDANCE_OPTIONS)[number]["id"];

/**
 * Filtro de asistencia del listado (Todos / Hoy / Sin asistencia) como
 * control segmentado sincronizado con el parámetro `attendance` de la URL.
 */
export function AttendanceFilter({
  active,
}: {
  active?: "today" | "never";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId: AttendanceValue = active ?? "all";

  return (
    <ToggleButtonGroup
      aria-label="Filtrar listado por asistencia"
      className="shrink-0 rounded-full border border-border bg-surface/60 p-0.5 dark:border-white/10"
      disallowEmptySelection
      onSelectionChange={(keys) => {
        const next = [...keys][0];
        if (next == null) return;
        const nextId = String(next);
        const params = new URLSearchParams(searchParams.toString());
        if (nextId === "all") {
          params.delete("attendance");
        } else {
          params.set("attendance", nextId);
        }
        // Un cambio de filtro siempre vuelve a la primera página.
        params.delete("p");
        router.push(`${pathname}?${params.toString()}`);
      }}
      selectedKeys={new Set([activeId])}
      selectionMode="single"
      size="sm"
    >
      {ATTENDANCE_OPTIONS.map((option) => (
        <ToggleButton
          className="rounded-full px-3 text-[11px] font-semibold text-muted data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
          id={option.id}
          key={option.id}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
