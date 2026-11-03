"use client";

import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
  type Key,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MULTIMEDIA_DAYS } from "@/lib/features/media/days";
import { formatMediaSize } from "@/lib/features/media/format";
import { MAX_MEDIA_BYTES } from "@/lib/features/media/types";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80";

export function UploadMediaForm({
  storageConfigured,
}: {
  storageConfigured: boolean;
}) {
  const router = useRouter();
  const [day, setDay] = useState<Key | null>("1");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending || !file) return;

    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("day", String(day ?? "1"));
    formData.set("title", title);
    formData.set("file", file);

    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.message ?? "No fue posible subir el archivo.");
        return;
      }

      toast.success("Archivo publicado correctamente.");
      setTitle("");
      setFile(null);
      router.refresh();
    } catch {
      setError("No fue posible conectar con el servidor. Intente de nuevo.");
    } finally {
      setIsPending(false);
    }
  }

  if (!storageConfigured) {
    return (
      <div
        className="flex flex-col gap-1 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3.5"
        role="status"
      >
        <p className="text-xs font-semibold text-gold-ink">
          Almacenamiento OCI no configurado
        </p>
        <p className="text-xs leading-relaxed text-muted">
          Defina <code className="font-mono">OCI_REGION</code>,{" "}
          <code className="font-mono">OCI_NAMESPACE</code>,{" "}
          <code className="font-mono">OCI_BUCKET</code> y las credenciales de
          firma (tenancy, user, fingerprint, private key) en <code className="font-mono">.env</code>{" "}
          para habilitar las cargas.
        </p>
      </div>
    );
  }

  return (
    <form
      aria-label="Subir material multimedia"
      className="glass flex flex-col gap-4 rounded-2xl border border-border p-5 shadow-sm dark:border-white/10"
      onSubmit={submit}
    >
      <div>
        <h2 className="font-display text-base font-bold tracking-tight text-foreground">
          Subir material
        </h2>
        <p className="mt-1 text-xs text-muted">
          Imágenes, videos o documentos. El archivo se publica en la galería
          del día seleccionado.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <Select
          isRequired
          className="w-full"
          name="day"
          placeholder="Día"
          value={day}
          onChange={setDay}
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
                  key={item.value}
                  id={String(item.value)}
                  textValue={item.label}
                >
                  {item.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <TextField isRequired name="title" onChange={setTitle} value={title}>
          <Label className={labelClass}>Descripción</Label>
          <Input
            aria-required
            className="mt-1.5 py-2.5 text-sm"
            placeholder="Ej. Ceremonia de inauguración"
          />
        </TextField>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="media-file">
          Archivo
        </label>
        <input
          accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
          className="block w-full cursor-pointer rounded-xl border border-field-border bg-field-background px-3 py-2.5 text-xs text-field-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-accent-foreground"
          id="media-file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          type="file"
        />
        <p className="text-[11px] text-muted">
          {file
            ? `${file.name} · ${formatMediaSize(file.size)}`
            : `Máximo ${Math.round(MAX_MEDIA_BYTES / (1024 * 1024))} MB por archivo.`}
        </p>
      </div>

      {error ? (
        <p
          aria-live="assertive"
          className="text-xs font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          className="rounded-full text-sm font-semibold"
          isDisabled={
            isPending || !file || title.trim().length < 2 || day === null
          }
          isPending={isPending}
          type="submit"
          variant="primary"
        >
          Publicar archivo
        </Button>
      </div>
    </form>
  );
}
