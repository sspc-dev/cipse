"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * Grid de tarjetas con virtualización por filas dentro de un contenedor con
 * scroll propio. Las columnas se leen del grid oculto que comparte las
 * mismas clases de Tailwind, de modo que los puntos de quiebre coinciden con
 * el diseño sin duplicar breakpoints en JavaScript.
 */

export type VirtualMediaSection = {
  key: string;
  header?: ReactNode;
  empty?: ReactNode;
  items: ReactNode[];
};

type VirtualRow =
  | { key: string; kind: "node"; content: ReactNode }
  | { key: string; kind: "cards"; cards: ReactNode[] };

type VirtualizedMediaGridProps = {
  sections: VirtualMediaSection[];
  ariaLabel: string;
  columnClassName?: string;
  maxHeightClassName?: string;
  estimatedCardRowHeight?: number;
  resetKey?: string;
  className?: string;
};

const DEFAULT_COLUMN_CLASS =
  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

function buildRows(
  sections: VirtualMediaSection[],
  columns: number,
): VirtualRow[] {
  const rows: VirtualRow[] = [];

  for (const section of sections) {
    if (section.header) {
      rows.push({
        key: `${section.key}__header`,
        kind: "node",
        content: section.header,
      });
    }

    if (section.items.length === 0) {
      if (section.empty) {
        rows.push({
          key: `${section.key}__empty`,
          kind: "node",
          content: section.empty,
        });
      }
      continue;
    }

    for (let index = 0; index < section.items.length; index += columns) {
      rows.push({
        key: `${section.key}__${index}`,
        kind: "cards",
        cards: section.items.slice(index, index + columns),
      });
    }
  }

  return rows;
}

export function VirtualizedMediaGrid({
  sections,
  ariaLabel,
  columnClassName = DEFAULT_COLUMN_CLASS,
  maxHeightClassName = "max-h-[min(70vh,760px)]",
  estimatedCardRowHeight = 380,
  resetKey,
  className = "",
}: VirtualizedMediaGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const element = measureRef.current;
    const scrollElement = scrollRef.current;

    if (!element || !scrollElement) return;

    const update = () => {
      const template = getComputedStyle(element).gridTemplateColumns;
      const count = template.split(" ").filter(Boolean).length;
      if (count > 0) setColumns(count);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(scrollElement);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rows = useMemo(
    () => buildRows(sections, columns),
    [sections, columns],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) =>
      rows[index].kind === "cards" ? estimatedCardRowHeight : 56,
    getItemKey: (index) => rows[index].key,
    overscan: 3,
  });

  useEffect(() => {
    if (resetKey === undefined) return;
    virtualizer.scrollToOffset(0);
  }, [resetKey, virtualizer]);

  return (
    <div className={className}>
      <div
        aria-hidden="true"
        ref={measureRef}
        className={`pointer-events-none invisible grid h-0 ${columnClassName}`}
      >
        <span />
        <span />
        <span />
        <span />
      </div>

      <div
        aria-label={ariaLabel}
        className={`relative overflow-y-auto overscroll-contain pr-1 focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2 ${maxHeightClassName}`}
        ref={scrollRef}
        role="region"
        tabIndex={0}
      >
        {mounted ? (
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];

              return (
                <div
                  className="absolute inset-x-0 top-0 pb-4"
                  data-index={virtualRow.index}
                  key={virtualRow.key}
                  ref={virtualizer.measureElement}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.kind === "cards" ? (
                    <div className={`grid gap-4 ${columnClassName}`}>
                      {row.cards}
                    </div>
                  ) : (
                    row.content
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`grid gap-4 ${columnClassName}`}>
            {Array.from({ length: 6 }, (_, index) => (
              <div
                className="aspect-[4/3] animate-pulse rounded-xl border border-border/50 bg-surface/40"
                key={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
