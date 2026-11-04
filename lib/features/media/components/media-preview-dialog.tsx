"use client";

import { Chip, Modal } from "@heroui/react";
import { DownloadIcon } from "@/components/icons";
import { formatMessage, type Dictionary } from "@/lib/i18n";
import { formatMediaSize, mediaFileUrl } from "../format";
import { mediaFormatTag, type MediaViewItem } from "../taxonomy";

type MediaPreviewDialogProps = {
  item: MediaViewItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  copy: Dictionary["media"];
};

export function MediaPreviewDialog({
  item,
  isOpen,
  onOpenChange,
  copy,
}: MediaPreviewDialogProps) {
  const isVisual = item?.kind === "image" || item?.kind === "video";

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
                <Modal.CloseTrigger
                  aria-label={copy.modal.closeAria}
                  className="text-muted hover:text-white"
                />
              </Modal.Header>

              <Modal.Body className="p-0">
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
                ) : isVisual ? (
                  /* Archivo servido por route handler; no pasa por optimización. */
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    alt={formatMessage(copy.modal.imageAlt, {
                      title: item.title,
                    })}
                    className="max-h-[70vh] w-full bg-black object-contain"
                    src={mediaFileUrl(item.id)}
                  />
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
