"use client";

import { useMemo, useState } from "react";
import { Button, SearchField, ToggleButton } from "@heroui/react";
import {
  ChevronRightIcon,
  DownloadIcon,
  FilePdfIcon,
  FilePresentationIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  PlayIcon,
  VideoIcon,
} from "@/components/icons";
import { formatMessage, type Dictionary } from "@/lib/i18n";
import { MULTIMEDIA_DAYS } from "../days";
import { formatMediaSize, mediaFileUrl } from "../format";
import {
  countMediaByKind,
  filterMediaItems,
  MEDIA_FILTERS,
  mediaFormatTag,
  type MediaFilter,
  type MediaViewItem,
} from "../taxonomy";
import { MediaPreviewDialog } from "./media-preview-dialog";

type MultimediaGalleryProps = {
  items: MediaViewItem[];
  copy: Dictionary["media"];
};

const FILTER_ICONS = {
  all: null,
  image: ImageIcon,
  video: VideoIcon,
  document: FileTextIcon,
} as const;

function dayButtonClassName(isActive: boolean): string {
  const base =
    "h-8 rounded-full px-5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold";

  return isActive
    ? `${base} bg-gold text-neutral-950 shadow-sm`
    : `${base} text-muted hover:bg-foreground/[0.06] hover:text-foreground`;
}

function filterButtonClassName(isActive: boolean): string {
  const base =
    "h-8 gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition-colors";

  return isActive
    ? `${base} border-gold/60 bg-gold/15 text-gold-ink`
    : `${base} border-border bg-foreground/[0.04] text-muted hover:bg-foreground/[0.08] hover:text-foreground`;
}

function countBadgeClassName(isActive: boolean): string {
  return isActive
    ? "rounded-full bg-gold/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gold-ink"
    : "rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted";
}

export function MultimediaGallery({ items, copy }: MultimediaGalleryProps) {
  const [day, setDay] = useState<number>(MULTIMEDIA_DAYS[0].value);
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [query, setQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<MediaViewItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const counts = useMemo(() => countMediaByKind(items, day), [items, day]);
  const visibleItems = useMemo(
    () => filterMediaItems(items, { day, filter, query }),
    [items, day, filter, query],
  );

  const activeDayLabel = formatMessage(copy.dayLabel, { n: day });
  const filterLabels: Record<MediaFilter, string> = {
    all: copy.filterAll,
    image: copy.filters.image,
    video: copy.filters.video,
    document: copy.filters.document,
  };

  function openPreview(item: MediaViewItem) {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  }

  return (
    <section
      aria-labelledby="galeria-congreso-heading"
      className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-2xl backdrop-blur-xl"
      id="galeria-congreso"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(197,155,39,0.12)_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <div
        aria-hidden="true"
        className="ambient-drift pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-tactical/20 blur-[120px]"
      />

      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-gold-ink uppercase">
              {copy.galleryEyebrow}
            </p>
            <h2
              className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              id="galeria-congreso-heading"
            >
              {copy.galleryHeading}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
              {copy.galleryDescription}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">
              {copy.counterLabel}
            </p>
            <p
              aria-live="polite"
              className="font-display text-3xl font-bold tracking-tight text-gold-ink sm:text-4xl"
            >
              {String(visibleItems.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div
            aria-label={copy.dayTabsAria}
            className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-foreground/[0.04] p-1.5 backdrop-blur-md"
            role="group"
          >
            {MULTIMEDIA_DAYS.map((option) => {
              const isActive = day === option.value;

              return (
                <ToggleButton
                  className={dayButtonClassName(isActive)}
                  isSelected={isActive}
                  key={option.value}
                  onChange={() => setDay(option.value)}
                  size="sm"
                >
                  {formatMessage(copy.dayLabel, { n: option.value })}
                </ToggleButton>
              );
            })}
          </div>

          <SearchField
            aria-label={copy.searchLabel}
            className="w-full lg:w-64"
            onChange={setQuery}
            value={query}
            variant="secondary"
          >
            <SearchField.Group className="rounded-full border border-border bg-foreground/[0.04]">
              <SearchField.SearchIcon className="text-muted" />
              <SearchField.Input
                className="text-xs placeholder:text-muted"
                placeholder={copy.searchPlaceholder}
              />
              <SearchField.ClearButton className="text-muted" />
            </SearchField.Group>
          </SearchField>
        </div>

        <div
          aria-label={copy.filtersAria}
          className="flex flex-wrap items-center gap-2"
          role="group"
        >
          {MEDIA_FILTERS.map((option) => {
            const Icon = FILTER_ICONS[option];
            const isActive = filter === option;

            return (
              <ToggleButton
                aria-label={filterLabels[option]}
                className={filterButtonClassName(isActive)}
                isSelected={isActive}
                key={option}
                onChange={() => setFilter(option)}
                size="sm"
              >
                {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
                {filterLabels[option]}
                <span className={countBadgeClassName(isActive)}>
                  {counts[option]}
                </span>
              </ToggleButton>
            );
          })}
        </div>

        {visibleItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) =>
              item.kind === "document" ? (
                <DocumentCard
                  copy={copy}
                  item={item}
                  key={item.id}
                  onOpen={openPreview}
                />
              ) : (
                <MediaCard
                  copy={copy}
                  item={item}
                  key={item.id}
                  onOpen={openPreview}
                />
              ),
            )}
          </div>
        ) : (
          <EmptyState
            activeDayLabel={activeDayLabel}
            copy={copy}
            hasAnyItems={items.length > 0}
            hasDayItems={counts.all > 0}
          />
        )}

        <div className="mt-2 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button isDisabled size="sm" variant="secondary">
            <DownloadIcon className="size-4" aria-hidden="true" />
            {copy.downloadPackage}
            <span className="ml-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold text-muted">
              {copy.downloadUnavailable}
            </span>
          </Button>
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
            {copy.securityNote}
          </p>
        </div>
      </div>

      <MediaPreviewDialog
        copy={copy}
        isOpen={isPreviewOpen}
        item={previewItem}
        items={visibleItems}
        onNavigate={setPreviewItem}
        onOpenChange={setIsPreviewOpen}
      />
    </section>
  );
}

function EmptyState({
  activeDayLabel,
  copy,
  hasAnyItems,
  hasDayItems,
}: {
  activeDayLabel: string;
  copy: Dictionary["media"];
  hasAnyItems: boolean;
  hasDayItems: boolean;
}) {
  const title = !hasAnyItems
    ? copy.noMedia
    : !hasDayItems
      ? formatMessage(copy.empty, { day: activeDayLabel })
      : copy.emptyFiltered;

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
      <span className="font-display text-sm font-semibold text-foreground">
        {title}
      </span>
      <p className="max-w-md text-xs leading-relaxed text-muted">
        {!hasAnyItems
          ? copy.noMediaHint
          : !hasDayItems
            ? copy.noMediaHint
            : copy.emptyFilteredHint}
      </p>
    </div>
  );
}

function MediaCard({
  copy,
  item,
  onOpen,
}: {
  copy: Dictionary["media"];
  item: MediaViewItem;
  onOpen: (item: MediaViewItem) => void;
}) {
  const isVideo = item.kind === "video";

  return (
    <button
      aria-label={formatMessage(copy.openAria, { title: item.title })}
      className="glass-soft group flex flex-col overflow-hidden rounded-xl border border-border text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-[0_12px_40px_-10px_rgba(197,155,39,0.45)] hover:ring-2 hover:ring-gold/25 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      onClick={() => onOpen(item)}
      type="button"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-black">
        {isVideo ? (
          <video
            className="size-full object-cover brightness-90 transition-transform duration-700 group-hover:scale-105"
            muted
            playsInline
            preload="metadata"
            src={mediaFileUrl(item.id)}
          />
        ) : (
          /* Archivo servido por route handler; no pasa por optimización. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            alt={item.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            src={mediaFileUrl(item.id)}
          />
        )}

        <span
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent"
        />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-md">
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${isVideo ? "bg-emerald-400" : "bg-gold"}`}
          />
          {mediaFormatTag(item)}
        </span>

        {isVideo ? (
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110"
          >
            <PlayIcon className="ml-0.5 size-4" />
          </span>
        ) : null}
      </span>

      <span className="flex flex-1 flex-col gap-1.5 px-3.5 pb-3.5 pt-3">
        <span
          className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-gold-ink"
          title={item.title}
        >
          {item.title}
        </span>
        <span className="mt-auto flex items-center justify-between gap-2 text-[11px] text-muted">
          <span>
            {formatMessage(copy.dayLabel, { n: item.day })} ·{" "}
            {formatMediaSize(item.sizeBytes)}
          </span>
          <ChevronRightIcon
            aria-hidden="true"
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </button>
  );
}

/** Icono representativo del formato del documento. */
function DocumentFormatIcon({ format }: { format: string }) {
  if (format === "PDF")
    return <FilePdfIcon className="size-5" aria-hidden="true" />;
  if (format === "XLS" || format === "XLSX")
    return <FileSpreadsheetIcon className="size-5" aria-hidden="true" />;
  if (format === "PPT" || format === "PPTX")
    return <FilePresentationIcon className="size-5" aria-hidden="true" />;
  return <FileTextIcon className="size-5" aria-hidden="true" />;
}

/** Los PDF se ven en el visor; el resto de formatos abren en pestaña nueva. */
function DocumentCard({
  copy,
  item,
  onOpen,
}: {
  copy: Dictionary["media"];
  item: MediaViewItem;
  onOpen: (item: MediaViewItem) => void;
}) {
  const isPdf = item.mime === "application/pdf";
  const cardClassName =
    "group flex h-full flex-col rounded-xl border border-border bg-linear-to-br from-tactical/85 to-[#082e22]/85 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_12px_40px_-10px_rgba(197,155,39,0.45)] hover:ring-2 hover:ring-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

  const content = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-gold-ceremonial transition-colors duration-300 group-hover:border-gold/40 group-hover:bg-gold/15">
          <DocumentFormatIcon format={mediaFormatTag(item)} />
        </span>
        <span className="font-mono text-[10px] font-bold tracking-widest text-gold-ceremonial uppercase">
          {mediaFormatTag(item)}
        </span>
      </span>

      <span className="mt-4 font-mono text-[10px] font-semibold tracking-[0.18em] text-emerald-300/80 uppercase">
        {formatMessage(copy.dayLabel, { n: item.day })} · {copy.kinds.document}
      </span>
      <span
        className="mt-1.5 line-clamp-3 text-sm font-semibold text-white"
        title={item.title}
      >
        {item.title}
      </span>

      <span className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-4 text-[11px] text-white/70">
        <span className="font-mono">{formatMediaSize(item.sizeBytes)}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-gold-ceremonial">
          {copy.openDocument}
          <ChevronRightIcon
            aria-hidden="true"
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </>
  );

  if (isPdf) {
    return (
      <button
        aria-label={formatMessage(copy.openDocumentPreviewAria, {
          title: item.title,
        })}
        className={cardClassName}
        onClick={() => onOpen(item)}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <a
      aria-label={formatMessage(copy.openDocumentAria, { title: item.title })}
      className={cardClassName}
      href={mediaFileUrl(item.id)}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  );
}
