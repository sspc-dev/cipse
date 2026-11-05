"use client";

import { useEffect } from "react";
import { Chip, Modal } from "@heroui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
} from "@/components/icons";
import { formatMessage, type Dictionary } from "@/lib/i18n";
import { formatMediaSize, mediaEmbedUrl, mediaFileUrl } from "../format";
import { mediaFormatTag, type MediaViewItem } from "../taxonomy";

type MediaPreviewDialogProps = {
  item: MediaViewItem | null;
  items: readonly MediaViewItem[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onNavigate: (item: MediaViewItem) => void;
  copy: Dictionary["media"];
};

const NAV_BUTTON_CLASS =
  "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export function MediaPreviewDialog({
  item,
  items,
  isOpen,
  onOpenChange,
  onNavigate,
  copy,
}: MediaPreviewDialogProps) {
  const index = item ? items.findIndex((i) => i.id === item.id) : -1;
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < items.length - 1;
  const isPdfDocument =
    item?.kind === "document" && item.mime === "application/pdf";
  const isUnsupportedDocument =
    item?.kind === "document" && !isPdfDocument;

  useEffect(() => {
    if (!isOpen || index < 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && hasPrev) {
        onNavigate(items[index - 1]);
      } else if (event.key === "ArrowRight" && hasNext) {
        onNavigate(items[index + 1]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, index, hasPrev, hasNext, items, onNavigate]);

  return (
    <Modal.Backdrop
      className="bg-black/80 backdrop-blur-xl"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="blur"
    >
      <Modal.Container>
        <Modal.Dialog className="w-full max-w-5xl overflow-hidden border border-gold/30 bg-[#0b1016] p-0 text-foreground shadow-2xl">
          {item ? (
            <>
              <Modal.Header className="relative flex-row items-center gap-3 border-b border-white/10 bg-[#0a0e13] px-5 py-4 pr-14">
                <Chip
                  className="shrink-0 rounded-full border border-gold/40 bg-gold/15 font-mono text-[10px] font-bold tracking-wider text-gold uppercase"
                  size="sm"
                  variant="secondary"
                >
                  {mediaFormatTag(item)} · {copy.modal.badge}
                </Chip>
                <Modal.Heading className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                  {item.title}
                </Modal.Heading>
                {index >= 0 ? (
                  <span className="shrink-0 font-mono text-[11px] text-neutral-400 tabular-nums">
                    {index + 1} / {items.length}
                  </span>
                ) : null}
                <Modal.CloseTrigger
                  aria-label={copy.modal.closeAria}
                  className="text-muted hover:text-white"
                />
              </Modal.Header>

              <Modal.Body className="relative p-0">
                <div key={item.id} className="pop-in">
                  {item.kind === "video" ? (
                    <video
                      aria-label={formatMessage(copy.modal.videoAria, {
                        title: item.title,
                      })}
                      autoPlay
                      className="max-h-[70vh] w-full bg-black"
                      controls
                      playsInline
                      src={mediaFileUrl(item.id)}
                    />
                  ) : isPdfDocument ? (
                    <iframe
                      aria-label={formatMessage(copy.modal.documentPreviewAria, {
                        title: item.title,
                      })}
                      className="h-[70vh] w-full bg-white"
                      src={mediaEmbedUrl(item.id)}
                      title={item.title}
                    />
                  ) : item.kind === "image" ? (
                    /* Archivo servido por route handler; no pasa por optimización. */
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      alt={formatMessage(copy.modal.imageAlt, {
                        title: item.title,
                      })}
                      className="max-h-[70vh] w-full bg-black object-contain"
                      src={mediaFileUrl(item.id)}
                    />
                  ) : isUnsupportedDocument ? (
                    <div className="flex h-[50vh] flex-col items-center justify-center gap-4 bg-black px-6 text-center">
                      <span className="flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
                        <FileTextIcon className="size-6" aria-hidden="true" />
                      </span>
                      <p className="max-w-sm text-xs leading-relaxed text-neutral-300">
                        {copy.modal.unsupported}
                      </p>
                    </div>
                  ) : null}
                </div>

                {hasPrev ? (
                  <button
                    aria-label={copy.modal.prevAria}
                    className={`${NAV_BUTTON_CLASS} left-3`}
                    onClick={() => onNavigate(items[index - 1])}
                    type="button"
                  >
                    <ChevronLeftIcon className="size-5" aria-hidden="true" />
                  </button>
                ) : null}
                {hasNext ? (
                  <button
                    aria-label={copy.modal.nextAria}
                    className={`${NAV_BUTTON_CLASS} right-3`}
                    onClick={() => onNavigate(items[index + 1])}
                    type="button"
                  >
                    <ChevronRightIcon className="size-5" aria-hidden="true" />
                  </button>
                ) : null}
              </Modal.Body>

              <Modal.Footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0a0e13] px-5 py-3.5">
                <p className="text-[11px] text-neutral-400">
                  {copy.modal.meta} · {formatMediaSize(item.sizeBytes)}
                </p>
                <a
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[11px] font-bold text-neutral-950 transition-colors hover:bg-gold-ceremonial"
                  download={item.originalName}
                  href={mediaFileUrl(item.id)}
                >
                  <DownloadIcon className="size-3.5" aria-hidden="true" />
                  {copy.modal.download}
                </a>
              </Modal.Footer>
            </>
          ) : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
