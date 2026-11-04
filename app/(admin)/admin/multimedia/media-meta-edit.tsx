"use client";

import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  type Key,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PencilIcon } from "@/components/icons";
import { updateEventMediaAction } from "@/lib/features/media/actions";
import { MULTIMEDIA_DAYS } from "@/lib/features/media/days";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80";

export function MediaMetaEdit({
  id,
  day,
  title,
  fileName,
}: {
  id: number;
  day: number;
  title: string;
  fileName: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [draftDay, setDraftDay] = useState<Key | null>(String(day));
  const [draftTitle, setDraftTitle] = useState(title);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setDraftDay(String(day));
    setDraftTitle(title);
    setError(null);
    setIsOpen(true);
  }

  async function save() {
    if (isPending) return;

    setIsPending(true);
    const result = await updateEventMediaAction({
      id,
      day: Number(draftDay ?? String(day)),
      title: draftTitle,
    });
    setIsPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    toast.success(result.message);
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        aria-label={`Editar ${title}`}
        onPress={open}
        size="sm"
        variant="tertiary"
      >
        <PencilIcon aria-hidden="true" className="size-3.5" />
        Editar
      </Button>

      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setError(null);
        }}
        variant="blur"
      >
        <Modal.Container>
          <Modal.Dialog className="border border-border bg-surface text-foreground">
            <Modal.Header className="flex-row items-center gap-3">
              <Modal.Heading className="min-w-0 flex-1 text-sm font-semibold">
                Editar archivo
              </Modal.Heading>
              <Modal.CloseTrigger aria-label="Cerrar" />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              <p className="truncate text-[11px] text-muted">{fileName}</p>

              <Select
                className="w-full"
                isDisabled={isPending}
                name="day"
                placeholder="Día"
                value={draftDay}
                onChange={setDraftDay}
              >
                <Label className={labelClass}>Día</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {MULTIMEDIA_DAYS.map((item) => (
                      <ListBox.Item
                        id={String(item.value)}
                        key={item.value}
                        textValue={item.label}
                      >
                        {item.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <TextField
                isDisabled={isPending}
                isRequired
                name="title"
                onChange={setDraftTitle}
                value={draftTitle}
              >
                <Label className={labelClass}>Descripción</Label>
                <Input maxLength={160} placeholder="Descripción del archivo" />
              </TextField>

              {error ? (
                <p
                  aria-live="assertive"
                  className="text-xs font-medium text-danger"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </Modal.Body>

            <Modal.Footer className="justify-end gap-2">
              <Button slot="close" variant="tertiary">
                Cancelar
              </Button>
              <Button
                isPending={isPending}
                onPress={() => void save()}
                variant="primary"
              >
                Guardar cambios
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
