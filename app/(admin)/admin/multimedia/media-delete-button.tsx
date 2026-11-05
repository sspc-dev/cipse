"use client";

import { AlertDialog, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteEventMediaAction } from "@/lib/features/media/actions";
import { AlertCircleIcon, TrashIcon } from "@/components/icons";

export function MediaDeleteButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function remove() {
    if (isPending) return;

    setIsPending(true);
    const result = await deleteEventMediaAction(id);
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setIsOpen(false);
    router.refresh();
  }

  return (
    <AlertDialog>
      <Button
        aria-label={`Eliminar ${title}`}
        className="h-8 rounded-md border border-border/70 px-2.5 text-[10px] font-semibold text-foreground transition-all duration-200 hover:-translate-y-px hover:border-danger/50 hover:bg-danger/5 hover:text-danger focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-1"
        onPress={() => setIsOpen(true)}
        size="sm"
        variant="danger-soft"
      >
        <TrashIcon aria-hidden="true" className="size-3.5" />
        Eliminar
      </Button>

      <AlertDialog.Backdrop
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        variant="blur"
      >
        <AlertDialog.Container>
          <AlertDialog.Dialog className="overflow-hidden rounded-md border border-border/60 bg-surface text-foreground shadow-2xl">
            {/* Barra superior de peligro */}
            <span
              aria-hidden="true"
              className="block h-0.5 w-full bg-gradient-to-r from-transparent via-danger/60 to-transparent"
            />

            <AlertDialog.CloseTrigger
              aria-label="Cerrar"
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-border/50 text-muted transition-colors hover:border-danger/40 hover:text-danger focus-visible:outline-2 focus-visible:outline-gold/60"
            />

            <AlertDialog.Header className="flex-row items-center gap-3 border-b border-border/40 bg-surface-secondary/50 px-5 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-danger/30 bg-danger/10 text-danger">
                <AlertCircleIcon className="size-4.5" aria-hidden="true" />
              </span>
              <AlertDialog.Heading className="text-sm font-semibold text-foreground">
                ¿Eliminar este archivo?
              </AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="px-5 py-5">
              <p className="text-xs leading-relaxed text-muted">
                Se eliminará{" "}
                <strong className="font-semibold text-foreground">
                  “{title}”
                </strong>{" "}
                del almacenamiento y de la galería pública. Esta acción no se
                puede deshacer.
              </p>
            </AlertDialog.Body>

            <AlertDialog.Footer className="justify-end gap-2 border-t border-border/40 bg-surface-secondary/30 px-5 py-4">
              <Button
                className="h-9 rounded-md px-4 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2"
                slot="close"
                variant="tertiary"
              >
                Cancelar
              </Button>
              <Button
                className="h-9 rounded-md px-5 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2"
                isPending={isPending}
                onPress={() => void remove()}
                variant="danger"
              >
                <TrashIcon aria-hidden="true" className="size-3.5" />
                Eliminar archivo
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
