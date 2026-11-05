"use client";

import { useEffect, useRef } from "react";
import { init, use as echartsUse, type ECElementEvent } from "echarts/core";
import type { EChartsOption } from "echarts";
import { BarChart, LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echartsUse([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  CanvasRenderer,
]);

export type ChartClickParams = Pick<
  ECElementEvent,
  "dataIndex" | "seriesIndex" | "name"
>;

type EChartsCanvasProps = {
  /** Etiqueta accesible del gráfico (role="img"). */
  ariaLabel: string;
  /** Clases de altura del contenedor, p. ej. `h-56`. */
  className?: string;
  /** Construye la opción en el cliente (permite leer tokens CSS del tema). */
  buildOption: () => EChartsOption;
  /** Cambia para reconstruir la opción (datos, periodo, filtros). */
  optionKey: unknown;
  onChartClick?: (params: ChartClickParams) => void;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Lienzo ECharts reutilizable del panel: monta la instancia en el cliente,
 * la redimensiona con su contenedor, respeta `prefers-reduced-motion` y
 * limpia el canvas al desmontar. Los datos llegan como props serializables.
 */
export function EChartsCanvas({
  ariaLabel,
  className = "h-56 w-full",
  buildOption,
  optionKey,
  onChartClick,
}: EChartsCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof init> | null>(null);
  const clickRef = useRef(onChartClick);

  useEffect(() => {
    clickRef.current = onChartClick;
  }, [onChartClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = init(container, undefined, { renderer: "canvas" });
    chartRef.current = chart;

    chart.on("click", (params) => {
      clickRef.current?.(params as ChartClickParams);
    });

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // La instancia se crea una vez; las opciones se actualizan abajo.
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const option = buildOption();
    chart.setOption(
      {
        animation: !prefersReducedMotion(),
        ...option,
      },
      { notMerge: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionKey]);

  return (
    <div
      aria-label={ariaLabel}
      className={className}
      ref={containerRef}
      role="img"
    />
  );
}
