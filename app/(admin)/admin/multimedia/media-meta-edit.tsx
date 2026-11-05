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
import { FileTextIcon, PencilIcon, XIcon } from "@/components/icons";
import { updateEventMediaAction } from "@/lib/features/media/actions";
import { MULTIMEDIA_DAYS } from "@/lib/features/media/days";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80";

const inputClass =
  "text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2";

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
        className="h-8 rounded-md border border-border/70 px-2.5 text-[10px] font-semibold text-foreground transition-all duration-200 hover:-translate-y-px hover:border-tactical/50 hover:bg-tactical/5 hover:text-tactical-bright focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-1"
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
          <Modal.Dialog className="overflow-hidden rounded-md border border-border/60 bg-surface text-foreground shadow-2xl">
            {/* Barra superior decorativa */}
            <span
              aria-hidden="true"
              className="block h-px w-full bg-gradient-to-r from-transparent via-tactical/50 to-transparent"
            />

            <Modal.Header className="flex-row items-center gap-3 border-b border-border/40 bg-surface-secondary/50 px-5 py-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-tactical/30 bg-tactical/10 text-tactical-bright">
                <PencilIcon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <Modal.Heading className="text-sm font-semibold text-foreground">
                  Editar archivo
                </Modal.Heading>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted">
                  <FileTextIcon className="size-3 shrink-0" aria-hidden="true" />
                  {fileName}
                </p>
              </div>
              <Modal.CloseTrigger
                aria-label="Cerrar"
                className="flex size-8 items-center justify-center rounded-full border border-border/50 text-muted transition-colors hover:border-danger/40 hover:text-danger focus-visible:outline-2 focus-visible:outline-gold/60"
              />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4 px-5 py-5">
              <Select
                className="w-full"
                isDisabled={isPending}
                name="day"
                placeholder="Día"
                value={draftDay}
                onChange={setDraftDay}
              >
                <Label className={labelClass}>Día</Label>
                <Select.Trigger className={inputClass}>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="rounded-lg border border-border/60 bg-surface shadow-xl">
                  <ListBox className="p-1">
                    {MULTIMEDIA_DAYS.map((item) => (
                      <ListBox.Item
                        className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-tactical/10 focus-visible:bg-tactical/10"
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
                <Input
                  className={inputClass}
                  maxLength={160}
                  placeholder="Descripción del archivo"
                />
              </TextField>

              {error ? (
                <div
                  aria-live="assertive"
                  className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3"
                  role="alert"
                >
                  <XIcon
                    className="mt-0.5 size-3.5 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-medium leading-relaxed text-danger">
                    {error}
                  </p>
                </div>
              ) : null}
            </Modal.Body>

            <Modal.Footer className="justify-end gap-2 border-t border-border/40 bg-surface-secondary/30 px-5 py-4">
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
