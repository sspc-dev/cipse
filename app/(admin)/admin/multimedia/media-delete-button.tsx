"use client";

import { AlertDialog, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteEventMediaAction } from "@/lib/features/media/actions";
import { TrashIcon } from "@/components/icons";

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
          <AlertDialog.Dialog>
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>¿Eliminar este archivo?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                Se eliminará <strong>“{title}”</strong> del almacenamiento y de
                la galería pública. Esta acción no se puede deshacer.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancelar
              </Button>
              <Button
                isPending={isPending}
                onPress={() => void remove()}
                variant="danger"
              >
                Eliminar archivo
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
