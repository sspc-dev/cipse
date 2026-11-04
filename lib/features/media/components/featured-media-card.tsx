"use client";

import { useState } from "react";
import { Chip } from "@heroui/react";
import { PlayIcon, ShieldIcon } from "@/components/icons";
import { formatMessage, type Dictionary } from "@/lib/i18n";
import { formatMediaSize, mediaFileUrl } from "../format";
import { mediaFormatTag, type MediaViewItem } from "../taxonomy";
import { MediaPreviewDialog } from "./media-preview-dialog";

type FeaturedMediaCardProps = {
  item: MediaViewItem | null;
  copy: Dictionary["media"];
};

export function FeaturedMediaCard({ item, copy }: FeaturedMediaCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!item) {
    return (
      <div className="relative flex aspect-[16/11] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border bg-foreground/[0.03] p-6 text-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(197,155,39,0.12),transparent_70%)]"
        />
        <span className="relative flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
          <ShieldIcon className="size-7" />
        </span>
        <p className="relative max-w-[26ch] text-xs leading-relaxed text-muted">
          {copy.featuredEmpty}
        </p>
      </div>
    );
  }

  const dayLabel = formatMessage(copy.dayLabel, { n: item.day });

  return (
    <>
      <button
        aria-label={formatMessage(copy.openAria, { title: item.title })}
        className="group relative block w-full overflow-hidden rounded-2xl border border-gold/40 text-left shadow-2xl outline-none transition-shadow hover:shadow-[0_0_40px_-10px_rgba(197,155,39,0.55)] focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {item.kind === "video" ? (
          <video
            className="aspect-[16/11] w-full bg-black object-cover brightness-90 transition-transform duration-700 group-hover:scale-[1.03]"
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
            className="aspect-[16/11] w-full bg-black object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
            src={mediaFileUrl(item.id)}
          />
        )}

        <span
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black via-black/35 to-transparent"
        />

        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
          {mediaFormatTag(item)} · {dayLabel}
        </span>

        {item.kind === "video" ? (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/60 bg-black/50 text-gold opacity-0 backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
          >
            <PlayIcon className="ml-0.5 size-6" />
          </span>
        ) : null}

        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
          <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">
            {copy.featuredEyebrow}
          </span>
          <span className="line-clamp-2 font-display text-base font-bold text-white sm:text-lg">
            {item.title}
          </span>
          <span className="flex items-center gap-2 text-[11px] text-white/70">
            <Chip
              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md"
              size="sm"
              variant="tertiary"
            >
              {copy.kinds[item.kind]}
            </Chip>
            {formatMediaSize(item.sizeBytes)}
          </span>
        </span>
      </button>

      <MediaPreviewDialog
        copy={copy}
        isOpen={isOpen}
        item={item}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
