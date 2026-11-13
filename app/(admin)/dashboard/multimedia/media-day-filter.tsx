"use client";

import { Tabs } from "@heroui/react";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { MULTIMEDIA_DAYS, type MultimediaDay } from "@/lib/features/media/days";
import {
  formatMediaSize,
  MEDIA_KIND_LABELS,
  mediaFileUrl,
  mediaThumbUrl,
} from "@/lib/features/media/format";
import { mediaFormatTag } from "@/lib/features/media/taxonomy";
import type { MediaItem } from "@/lib/features/media/types";
import { VideoPlaceholder } from "@/lib/features/media/components/video-placeholder";
import { VirtualizedMediaGrid } from "@/lib/features/media/components/virtualized-media-grid";
import {
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  FilePdfIcon,
  FilePresentationIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
} from "@/components/icons";
import { MediaDeleteButton } from "./media-delete-button";
import { MediaMetaEdit } from "./media-meta-edit";
import { PdfViewerButton } from "./pdf-viewer";

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

function KindIcon({ kind }: { kind: MediaItem["kind"] }) {
  if (kind === "image")
    return <ImageIcon className="size-4" aria-hidden="true" />;
  if (kind === "video")
    return <VideoIcon className="size-4" aria-hidden="true" />;
  return <FileTextIcon className="size-4" aria-hidden="true" />;
}

/**
 * Icono representativo del formato del documento. Diferencia hojas de
 * cálculo, presentaciones y PDF para identificar el tipo de un vistazo.
 */
function DocumentKindIcon({ format }: { format: string }) {
  if (format === "PDF") return <FilePdfIcon className="size-7" />;
  if (format === "XLS" || format === "XLSX")
    return <FileSpreadsheetIcon className="size-7" />;
  if (format === "PPT" || format === "PPTX")
    return <FilePresentationIcon className="size-7" />;
  return <FileTextIcon className="size-7" />;
}

/**
 * Placeholder para documentos sin miniatura (PDF y formatos de oficina).
 * Muestra el icono del formato y su etiqueta técnica para que la tarjeta
 * no quede vacía y el tipo de archivo se identifique de un vistazo.
 */
function DocumentThumbnail({
  tag,
  tone,
}: {
  tag: string;
  tone: "guinda" | "neutral";
}) {
  const isGuinda = tone === "guinda";

  return (
    <span
      className={`flex size-full flex-col items-center justify-center gap-2.5 transition-colors ${
        isGuinda
          ? "bg-guinda/5 text-guinda group-hover:bg-guinda/10"
          : "bg-foreground/[0.03] text-muted group-hover:bg-tactical/10 group-hover:text-tactical-bright"
      }`}
    >
      <span
        className={`flex size-16 items-center justify-center rounded-md border transition-transform duration-300 group-hover:scale-105 ${
          isGuinda
            ? "border-guinda/25 bg-guinda/10"
            : "border-border/70 bg-foreground/5 group-hover:border-tactical/40 group-hover:bg-tactical/10"
        }`}
      >
        <DocumentKindIcon format={tag} />
      </span>
      <span
        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
          isGuinda
            ? "border-guinda/30 bg-guinda/10 text-guinda"
            : "border-border/70 bg-foreground/5 text-muted group-hover:border-tactical/40 group-hover:text-tactical-bright"
        }`}
      >
        {tag}
      </span>
    </span>
  );
}

function MediaCard({ item }: { item: MediaItem }) {
  const isPdf = item.mime === "application/pdf";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-border/60 bg-surface/50 shadow-sm transition-all duration-300 hover:border-tactical/40 hover:shadow-[0_4px_24px_rgba(29,75,68,0.12)]">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-tactical/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />

      {/* Thumbnail cuadrado */}
      <div className="relative aspect-square w-full shrink-0 overflow-hidden border-b border-border/50 bg-foreground/5">
        {item.kind === "image" ? (
          /* Archivo servido por route handler; no pasa por optimización. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            aria-hidden="true"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            src={mediaThumbUrl(item.id)}
          />
        ) : item.kind === "video" ? (
          <VideoPlaceholder size="sm" />
        ) : isPdf ? (
          <DocumentThumbnail tag="PDF" tone="guinda" />
        ) : (
          <DocumentThumbnail tag={mediaFormatTag(item)} tone="neutral" />
        )}

        {/* Badge de formato: solo para imagen/video; los documentos ya
            muestran su etiqueta dentro del placeholder central. */}
        {item.kind !== "document" ? (
          <span className="absolute left-2 top-2 inline-flex items-center rounded border border-tactical/40 bg-surface/85 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-tactical-bright backdrop-blur-sm">
            {mediaFormatTag(item)}
          </span>
        ) : null}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3
          className="line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-snug text-foreground"
          title={item.title}
        >
          {item.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
          <span className="inline-flex items-center gap-1">
            <KindIcon kind={item.kind} />
            {MEDIA_KIND_LABELS[item.kind]}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3" aria-hidden="true" />
            {dateTimeFormatter.format(item.createdAt)}
          </span>
          <span className="font-mono text-muted/60">
            {formatMediaSize(item.sizeBytes)}
          </span>
        </div>

        {/* Acciones: primaria + editar a la izquierda, eliminar separado a la derecha */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2.5">
          <div className="flex flex-1 items-center gap-1.5">
            {isPdf ? (
              <PdfViewerButton
                fileUrl={mediaFileUrl(item.id)}
                title={item.title}
              />
            ) : (
              <a
                aria-label={`Abrir ${item.title} en pestaña nueva`}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 px-2.5 text-[10px] font-semibold text-foreground transition-all duration-200 hover:-translate-y-px hover:border-tactical/50 hover:bg-tactical/5 hover:text-tactical-bright focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-1"
                href={mediaFileUrl(item.id)}
                rel="noreferrer"
                target="_blank"
              >
                <EyeIcon className="size-3" aria-hidden="true" />
                Abrir
              </a>
            )}
            <MediaMetaEdit
              day={item.day}
              fileName={item.originalName}
              id={item.id}
              title={item.title}
            />
          </div>
          <MediaDeleteButton id={item.id} title={item.title} />
        </div>
      </div>
    </article>
  );
}

const tabsListClassName = [
  "gap-1.5",
  "**:data-[slot=tabs-tab]:rounded-md",
  "**:data-[slot=tabs-tab]:gap-2",
  "**:data-[slot=tabs-tab]:px-4",
  "**:data-[slot=tabs-tab]:py-2.5",
  "**:data-[slot=tabs-tab]:text-xs",
  "**:data-[slot=tabs-tab]:font-semibold",
  "**:data-[slot=tabs-tab]:uppercase",
  "**:data-[slot=tabs-tab]:tracking-[0.1em]",
  "**:data-[slot=tabs-tab]:transition-all",
  "**:data-[slot=tabs-tab]:duration-200",
  "**:data-[slot=tabs-tab]:data-[selected=true]:bg-tactical",
  "**:data-[slot=tabs-tab]:data-[selected=true]:text-white",
  "**:data-[slot=tabs-tab]:data-[selected=true]:shadow-[0_2px_12px_rgba(29,75,68,0.35)]",
  "**:data-[slot=tabs-tab]:data-[hovered=true]:not-data-[selected=true]:bg-tactical/10",
  "**:data-[slot=tabs-tab]:data-[hovered=true]:not-data-[selected=true]:text-tactical-bright",
  "**:data-[slot=tabs-tab]:data-[pressed=true]:not-data-[selected=true]:bg-tactical/15",
  "**:data-[slot=tabs-tab]:data-[focus-visible=true]:outline-2",
  "**:data-[slot=tabs-tab]:data-[focus-visible=true]:outline-gold/60",
  "**:data-[slot=tabs-tab]:data-[focus-visible=true]:outline-offset-2",
  "**:data-[slot=tabs-tab]:data-[disabled=true]:opacity-40",
  "**:data-[slot=tabs-tab]:data-[disabled=true]:cursor-not-allowed",
  "**:data-[slot=tabs-indicator]:hidden",
].join(" ");

/** Contador dentro de la pestaña. Se adapta al estado seleccionado. */
function TabCount({
  count,
  isSelected,
}: {
  count: number;
  isSelected?: boolean;
}) {
  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center rounded px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none transition-colors ${
        isSelected
          ? "border border-white/25 bg-white/15 text-white"
          : "border border-border/50 bg-foreground/5 text-muted"
      }`}
    >
      {count}
    </span>
  );
}

const MEDIA_CARDS_COLUMNS =
  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";
const MEDIA_LIST_MAX_HEIGHT = "max-h-[min(78vh,960px)]";
const MEDIA_CARD_ROW_HEIGHT = 480;

/**
 * Encabezado de un día. Se reutiliza tanto en el panel "Todos" como en el
 * panel de un solo día.
 */
function DayHeader({
  day,
  dayNumber,
  count,
}: {
  day: MultimediaDay;
  dayNumber: number;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 items-center justify-center rounded-md border border-tactical/25 bg-tactical/10 font-mono text-[10px] font-bold text-tactical-bright">
        {dayNumber}
      </span>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {day.label}
      </h3>
      {count !== undefined ? (
        <span className="inline-flex items-center rounded-full border border-border/60 bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold leading-none tracking-[0.12em] normal-case text-muted">
          {count}
        </span>
      ) : null}
      <span
        aria-hidden="true"
        className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent"
      />
    </div>
  );
}

function DayEmptyState({ day }: { day: MultimediaDay }) {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-surface/30 px-4 py-10 text-center">
      <FileTextIcon
        className="mx-auto mb-2 size-5 text-muted/40"
        aria-hidden="true"
      />
      <p className="text-xs text-muted">
        Sin material publicado para {day.label.toLowerCase()}.{" "}
        <Link
          className="font-semibold text-accent-soft-foreground underline-offset-2 transition-colors hover:text-tactical-bright hover:underline"
          href="#cargar-material"
        >
          Súbelo desde la sección de carga.
        </Link>
      </p>
    </div>
  );
}

function renderMediaCards(items: MediaItem[]): ReactNode[] {
  return items.map((item) => <MediaCard item={item} key={item.id} />);
}

export function MediaDayFilter({ media }: { media: MediaItem[] }) {
  const [selectedDay, setSelectedDay] = useState<string>("all");

  const counts = new Map<number, number>();
  for (const item of media) {
    counts.set(item.day, (counts.get(item.day) ?? 0) + 1);
  }

  return (
    <Tabs
      className="w-full"
      selectedKey={selectedDay}
      variant="primary"
      onSelectionChange={(key) => setSelectedDay(String(key))}
    >
      {/* Encabezado + filtro chip-group */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="flex shrink-0 items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          <CalendarIcon className="size-3.5" aria-hidden="true" />
          Material por día
        </h2>
        <span
          aria-hidden="true"
          className="hidden h-px flex-1 bg-gradient-to-r from-border/60 to-transparent sm:block"
        />

        <Tabs.ListContainer className="rounded-md border border-border/50 bg-surface-secondary/60 p-1">
          <Tabs.List
            aria-label="Filtrar material por día"
            className={tabsListClassName}
          >
            <Tabs.Tab
              aria-label={`Mostrar todos los días, ${media.length} archivos`}
              id="all"
            >
              <CalendarIcon className="size-3.5" aria-hidden="true" />
              Todos
              <TabCount count={media.length} isSelected={selectedDay === "all"} />
            </Tabs.Tab>
            {MULTIMEDIA_DAYS.map((day, index) => {
              const count = counts.get(day.value) ?? 0;
              const isSelected = selectedDay === String(day.value);
              return (
                <Tabs.Tab
                  aria-label={`${day.label}, ${count} archivos`}
                  id={String(day.value)}
                  isDisabled={count === 0}
                  key={day.value}
                >
                  <span className="flex size-4 items-center justify-center rounded border border-current/30 font-mono text-[9px] font-bold leading-none opacity-80">
                    {index + 1}
                  </span>
                  {day.label}
                  <TabCount count={count} isSelected={isSelected} />
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>
      </div>

      {/* Panel "Todos": agrupa por día */}
      <Tabs.Panel id="all">
        <div
          aria-live="polite"
          className="card-enter"
          key={`all-${media.length}`}
        >
          <VirtualizedMediaGrid
            ariaLabel="Material multimedia de todos los días"
            columnClassName={MEDIA_CARDS_COLUMNS}
            estimatedCardRowHeight={MEDIA_CARD_ROW_HEIGHT}
            maxHeightClassName={MEDIA_LIST_MAX_HEIGHT}
            resetKey={`all-${media.length}`}
            sections={MULTIMEDIA_DAYS.map((day, index) => {
              const items = media.filter((item) => item.day === day.value);

              return {
                key: `day-${day.value}`,
                header: (
                  <DayHeader
                    count={items.length}
                    day={day}
                    dayNumber={index + 1}
                  />
                ),
                empty: <DayEmptyState day={day} />,
                items: renderMediaCards(items),
              };
            })}
          />
        </div>
      </Tabs.Panel>

      {/* Paneles por día (solo se muestra el seleccionado) */}
      {MULTIMEDIA_DAYS.map((day, index) => {
        const items = media.filter((item) => item.day === day.value);

        return (
          <Tabs.Panel id={String(day.value)} key={day.value}>
            <div aria-live="polite" className="card-enter" key={selectedDay}>
              <VirtualizedMediaGrid
                ariaLabel={day.label}
                columnClassName={MEDIA_CARDS_COLUMNS}
                estimatedCardRowHeight={MEDIA_CARD_ROW_HEIGHT}
                maxHeightClassName={MEDIA_LIST_MAX_HEIGHT}
                resetKey={selectedDay}
                sections={[
                  {
                    key: `day-${day.value}`,
                    header: <DayHeader day={day} dayNumber={index + 1} />,
                    empty: <DayEmptyState day={day} />,
                    items: renderMediaCards(items),
                  },
                ]}
              />
            </div>
          </Tabs.Panel>
        );
      })}
    </Tabs>
  );
}
