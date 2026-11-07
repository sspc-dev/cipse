"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import { FileTextIcon, XIcon } from "@/components/icons";

/**
 * Visor de PDF en modal. Usa el visor nativo del navegador via <iframe>
 * para no introducir dependencias pesadas.
 */
export function PdfViewerButton({
  fileUrl,
  title,
}: {
  fileUrl: string;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  function open() {
    setIsLoading(true);
    setIsOpen(true);
  }

  return (
    <>
      <Button
        aria-label={`Ver PDF: ${title}`}
        className="h-8 rounded-md border border-border/70 px-2.5 text-[10px] font-semibold text-foreground transition-all duration-200 hover:-translate-y-px hover:border-tactical/50 hover:bg-tactical/5 hover:text-tactical-bright focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-1"
        onPress={open}
        size="sm"
        variant="tertiary"
      >
        <FileTextIcon aria-hidden="true" className="size-3.5" />
        Ver PDF
      </Button>

      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setIsLoading(true);
        }}
        variant="blur"
      >
        <Modal.Container className="max-w-4xl">
          <Modal.Dialog className="overflow-hidden rounded-md border border-border/60 bg-surface text-foreground shadow-2xl">
            {/* Barra superior */}
            <span
              aria-hidden="true"
              className="block h-px w-full bg-gradient-to-r from-transparent via-tactical/50 to-transparent"
            />

            <Modal.Header className="flex-row items-center gap-3 border-b border-border/40 bg-surface-secondary/50 px-5 py-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-tactical/30 bg-tactical/10 text-tactical-bright">
                <FileTextIcon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <Modal.Heading className="truncate text-sm font-semibold text-foreground">
                  {title}
                </Modal.Heading>
                <p className="mt-0.5 text-[11px] text-muted">Documento PDF</p>
              </div>
              <Modal.CloseTrigger
                aria-label="Cerrar visor"
                className="flex size-8 items-center justify-center rounded-full border border-border/50 text-muted transition-colors hover:border-danger/40 hover:text-danger focus-visible:outline-2 focus-visible:outline-gold/60"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Modal.CloseTrigger>
            </Modal.Header>

            <Modal.Body className="relative flex h-[70vh] flex-col p-0">
              {isLoading ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface">
                  <span className="size-8 animate-spin rounded-full border-2 border-tactical border-t-transparent" />
                  <p className="text-xs text-muted">Cargando documento…</p>
                </div>
              ) : null}

              {/* Visor nativo del navegador */}
              <iframe
                aria-label={`Visor de PDF: ${title}`}
                className="size-full min-h-[70vh] w-full border-0"
                onLoad={() => setIsLoading(false)}
                src={`${fileUrl}?view=inline#toolbar=1&view=FitH`}
                title={`PDF: ${title}`}
              />
            </Modal.Body>

            <Modal.Footer className="justify-between gap-2 border-t border-border/40 bg-surface-secondary/30 px-5 py-3">
              <a
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border/70 px-3.5 text-[11px] font-semibold text-foreground transition-all duration-200 hover:border-tactical/50 hover:bg-tactical/5 hover:text-tactical-bright focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-1"
                href={`${fileUrl}?view=inline`}
                rel="noreferrer"
                target="_blank"
              >
                Abrir en pestaña nueva
              </a>
              <Button
                className="h-9 rounded-md px-4 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2"
                slot="close"
                variant="tertiary"
              >
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
