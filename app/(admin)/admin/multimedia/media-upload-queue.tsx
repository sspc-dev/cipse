"use client";

import {
  Button,
  Input,
  Label,
  ListBox,
  ProgressBar,
  Select,
  TextField,
  type Key,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircleIcon,
  CheckIcon,
  FileTextIcon,
  RefreshIcon,
  TrashIcon,
  UploadIcon,
  VideoIcon,
} from "@/components/icons";
import { MULTIMEDIA_DAYS } from "@/lib/features/media/days";
import {
  formatMediaSize,
  MEDIA_KIND_LABELS,
} from "@/lib/features/media/format";
import {
  MAX_MEDIA_BYTES,
  mediaKindFromMime,
  type MediaKind,
} from "@/lib/features/media/types";

const ACCEPTED_TYPES =
  "image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt";

const MAX_MB = Math.round(MAX_MEDIA_BYTES / (1024 * 1024));

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80";

type EntryStatus = "pending" | "uploading" | "done" | "error";

type QueueEntry = {
  id: string;
  file: File;
  kind: MediaKind;
  title: string;
  day: number;
  previewUrl: string | null;
  status: EntryStatus;
  progress: number;
  error: string | null;
};

type UploadResponse = { ok?: boolean; id?: number; message?: string };

type SendResult = {
  ok: boolean;
  message?: string;
  aborted?: boolean;
};

function titleFromFile(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return base.length >= 2 ? base.slice(0, 160) : "Archivo";
}

function entryKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function sendEntry(
  entry: QueueEntry,
  onProgress: (progress: number) => void,
  registerXhr: (xhr: XMLHttpRequest | null) => void,
): Promise<SendResult> {
  return new Promise<SendResult>((resolve) => {
    const xhr = new XMLHttpRequest();
    registerXhr(xhr);
    xhr.open("POST", "/api/media/upload");
    xhr.responseType = "json";

    const finish = (result: SendResult) => {
      registerXhr(null);
      resolve(result);
    };

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      const payload = (xhr.response ?? null) as UploadResponse | null;

      if (xhr.status >= 200 && xhr.status < 300 && payload?.ok) {
        finish({ ok: true });
        return;
      }

      finish({
        ok: false,
        message: payload?.message ?? "No fue posible subir el archivo.",
      });
    });

    xhr.addEventListener("error", () => {
      finish({
        ok: false,
        message: "No fue posible conectar con el servidor. Intente de nuevo.",
      });
    });

    xhr.addEventListener("abort", () => {
      finish({ ok: false, aborted: true, message: "Carga detenida." });
    });

    const body = new FormData();
    body.set("day", String(entry.day));
    body.set("title", entry.title.trim());
    body.set("file", entry.file);

    xhr.send(body);
  });
}

export function MediaUploadQueue({
  storageConfigured,
}: {
  storageConfigured: boolean;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [batchDay, setBatchDay] = useState<Key | null>("1");
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const entriesRef = useRef<QueueEntry[]>(entries);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const stopRef = useRef(false);
  const busyRef = useRef(false);
  const previewUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = previewUrls.current;

    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

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
          firma (tenancy, user, fingerprint, private key) en{" "}
          <code className="font-mono">.env</code> para habilitar las cargas.
        </p>
      </div>
    );
  }

  function commit(updater: (previous: QueueEntry[]) => QueueEntry[]) {
    setEntries((previous) => {
      const next = updater(previous);
      entriesRef.current = next;
      return next;
    });
  }

  function patch(id: string, changes: Partial<QueueEntry>) {
    commit((previous) =>
      previous.map((entry) =>
        entry.id === id ? { ...entry, ...changes } : entry,
      ),
    );
  }

  function releasePreview(entry: QueueEntry) {
    if (!entry.previewUrl) return;
    URL.revokeObjectURL(entry.previewUrl);
    previewUrls.current.delete(entry.previewUrl);
  }

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const existing = new Set(
      entriesRef.current.map((entry) => entryKey(entry.file)),
    );
    const accepted: QueueEntry[] = [];
    const rejected: string[] = [];
    let duplicates = 0;

    for (const file of files) {
      const key = entryKey(file);

      if (existing.has(key)) {
        duplicates += 1;
        continue;
      }
      existing.add(key);

      const kind = mediaKindFromMime(file.type);

      if (file.size === 0) {
        rejected.push(`${file.name}: archivo vacío`);
        continue;
      }
      if (file.size > MAX_MEDIA_BYTES) {
        rejected.push(`${file.name}: supera ${MAX_MB} MB`);
        continue;
      }
      if (!kind) {
        rejected.push(`${file.name}: formato no permitido`);
        continue;
      }

      const previewUrl =
        kind === "image" || kind === "video"
          ? URL.createObjectURL(file)
          : null;

      if (previewUrl) previewUrls.current.add(previewUrl);

      accepted.push({
        id: crypto.randomUUID(),
        file,
        kind,
        title: titleFromFile(file.name),
        day: Number(batchDay ?? "1"),
        previewUrl,
        status: "pending",
        progress: 0,
        error: null,
      });
    }

    if (accepted.length > 0) {
      commit((previous) => [...previous, ...accepted]);
      toast.success(
        `${accepted.length} archivo(s) en la cola. Ajuste día y descripción antes de publicar.`,
      );
    }

    if (duplicates > 0) {
      toast.info(`${duplicates} archivo(s) duplicado(s) ignorado(s).`);
    }

    if (rejected.length > 0) {
      toast.error(`${rejected.length} archivo(s) no se agregaron`, {
        description:
          rejected.slice(0, 3).join(" · ") +
          (rejected.length > 3 ? "…" : ""),
      });
    }
  }

  function removeEntry(id: string) {
    const entry = entriesRef.current.find((item) => item.id === id);
    if (!entry || entry.status === "uploading") return;

    releasePreview(entry);
    commit((previous) => previous.filter((item) => item.id !== id));
  }

  function changeBatchDay(value: Key | null) {
    setBatchDay(value);
    const day = Number(value ?? "1");

    commit((previous) =>
      previous.map((entry) =>
        entry.status === "pending" ? { ...entry, day } : entry,
      ),
    );
  }

  function clearPublished() {
    commit((previous) => {
      for (const entry of previous) {
        if (entry.status === "done") releasePreview(entry);
      }

      return previous.filter((entry) => entry.status !== "done");
    });
  }

  async function run(ids: string[]) {
    if (busyRef.current) return;

    const queue = ids
      .map((id) => entriesRef.current.find((entry) => entry.id === id))
      .filter((entry): entry is QueueEntry => Boolean(entry));

    if (queue.length === 0) return;

    busyRef.current = true;
    stopRef.current = false;
    setIsUploading(true);

    let published = 0;
    let failed = 0;

    for (const item of queue) {
      if (stopRef.current) break;

      const current = entriesRef.current.find((entry) => entry.id === item.id);
      if (!current || current.status === "done") continue;

      const title = current.title.trim();

      if (title.length < 2) {
        patch(current.id, {
          status: "error",
          error: "Describa el archivo con al menos 2 caracteres.",
        });
        failed += 1;
        continue;
      }

      patch(current.id, { status: "uploading", progress: 0, error: null });

      const result = await sendEntry(
        { ...current, title },
        (progress) => patch(current.id, { progress }),
        (xhr) => {
          xhrRef.current = xhr;
        },
      );

      if (result.aborted) {
        patch(current.id, { status: "pending", progress: 0, error: null });
        break;
      }

      if (result.ok) {
        published += 1;
        patch(current.id, { status: "done", progress: 100, error: null });
      } else {
        failed += 1;
        patch(current.id, {
          status: "error",
          error: result.message ?? "No fue posible subir el archivo.",
        });
      }
    }

    busyRef.current = false;
    setIsUploading(false);

    if (published > 0) {
      toast.success(
        `${published} archivo(s) publicados en la galería del congreso.`,
      );
      router.refresh();
    }

    if (failed > 0) {
      toast.error(`${failed} archivo(s) no se pudieron publicar.`);
    }

    if (stopRef.current) {
      toast.info("Carga detenida. Los archivos pendientes se conservan.");
    }
  }

  function retry(id: string) {
    patch(id, { status: "pending", progress: 0, error: null });
    void run([id]);
  }

  function stop() {
    stopRef.current = true;
    xhrRef.current?.abort();
  }

  function submit() {
    const pendingIds = entriesRef.current
      .filter((entry) => entry.status === "pending" || entry.status === "error")
      .map((entry) => entry.id);

    void run(pendingIds);
  }

  const pendingCount = entries.filter(
    (entry) => entry.status === "pending" || entry.status === "error",
  ).length;
  const doneCount = entries.filter((entry) => entry.status === "done").length;
  const uploadingCount = entries.filter(
    (entry) => entry.status === "uploading",
  ).length;
  const overallProgress =
    entries.length > 0 ? Math.round((doneCount / entries.length) * 100) : 0;

  return (
    <section
      aria-labelledby="media-upload-heading"
      className="glass flex flex-col gap-4 rounded-2xl border border-border p-5 shadow-sm dark:border-white/10"
      id="cargar-material"
    >
      <div>
        <h2
          className="font-display text-base font-bold tracking-tight text-foreground"
          id="media-upload-heading"
        >
          Subir material
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Imágenes, videos o documentos. Puede seleccionar varios archivos,
          ajustar el día y la descripción de cada uno y publicarlos en la
          galería.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[180px_1fr] sm:items-end">
        <Select
          className="w-full"
          isDisabled={isUploading}
          name="batch-day"
          placeholder="Día"
          value={batchDay}
          onChange={changeBatchDay}
        >
          <Label className={labelClass}>Día para nuevos archivos</Label>
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

        <p className="text-[11px] leading-relaxed text-muted">
          Máximo {MAX_MB} MB por archivo. La descripción se toma del nombre del
          archivo y puede editarla en la cola antes de publicar.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="media-files">
          Archivos
        </label>
        <label
          className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-background ${
            dragOver
              ? "border-accent bg-accent-soft/50"
              : "border-field-border hover:border-field-border-hover"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepth.current += 1;
            setDragOver(true);
          }}
          onDragLeave={() => {
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setDragOver(false);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <UploadIcon
            aria-hidden="true"
            className={`size-5 ${dragOver ? "text-accent-soft-foreground" : "text-muted"}`}
          />
          <span className="text-xs font-semibold text-foreground">
            Arrastre archivos o haga clic para seleccionarlos
          </span>
          <span className="text-[10px] text-muted">
            Puede seleccionar varios a la vez · máx. {MAX_MB} MB cada uno
          </span>
          <input
            accept={ACCEPTED_TYPES}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            id="media-files"
            multiple
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
            ref={inputRef}
            type="file"
          />
        </label>
      </div>

      {entries.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              aria-live="polite"
              className="font-mono text-[10px] tracking-wider text-muted uppercase"
            >
              {doneCount} de {entries.length} publicados
              {uploadingCount > 0 ? ` · subiendo ${uploadingCount}` : ""}
              {pendingCount > 0 ? ` · ${pendingCount} pendientes` : ""}
            </p>
            {doneCount > 0 ? (
              <Button
                isDisabled={isUploading}
                onPress={clearPublished}
                size="sm"
                variant="tertiary"
              >
                Limpiar publicados
              </Button>
            ) : null}
          </div>

          {isUploading ? (
            <ProgressBar
              aria-label="Progreso total de publicación"
              color="accent"
              size="sm"
              value={overallProgress}
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          ) : null}

          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <QueueRow
                entry={entry}
                isUploading={isUploading}
                key={entry.id}
                onRemove={() => removeEntry(entry.id)}
                onRetry={() => retry(entry.id)}
                onUpdate={(changes) => patch(entry.id, changes)}
              />
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
            <p className="text-[10px] text-muted">
              Los archivos publicados aparecen de inmediato en la galería
              pública.
            </p>
            <div className="flex items-center gap-2">
              {isUploading ? (
                <Button onPress={stop} size="sm" variant="secondary">
                  Detener
                </Button>
              ) : null}
              <Button
                isDisabled={isUploading || pendingCount === 0}
                isPending={isUploading}
                onPress={submit}
                size="sm"
                variant="primary"
              >
                <UploadIcon aria-hidden="true" className="size-4" />
                Publicar{" "}
                {pendingCount > 0
                  ? `${pendingCount} ${pendingCount === 1 ? "archivo" : "archivos"}`
                  : "archivos"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function QueueRow({
  entry,
  isUploading,
  onRemove,
  onRetry,
  onUpdate,
}: {
  entry: QueueEntry;
  isUploading: boolean;
  onRemove: () => void;
  onRetry: () => void;
  onUpdate: (changes: Partial<QueueEntry>) => void;
}) {
  const isLocked = entry.status === "uploading" || entry.status === "done";

  return (
    <li className="flex flex-col gap-2.5 rounded-xl border border-border/70 bg-background/40 p-3">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-foreground/5 text-muted">
          {entry.previewUrl && entry.kind === "image" ? (
            /* Vista previa local; no pasa por optimización. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt=""
              aria-hidden="true"
              className="size-full object-cover"
              src={entry.previewUrl}
            />
          ) : entry.previewUrl && entry.kind === "video" ? (
            <video
              aria-hidden="true"
              className="size-full object-cover"
              muted
              playsInline
              preload="metadata"
              src={entry.previewUrl}
            />
          ) : entry.kind === "video" ? (
            <VideoIcon aria-hidden="true" className="size-4" />
          ) : (
            <FileTextIcon aria-hidden="true" className="size-4" />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-xs font-semibold text-foreground">
            {entry.file.name}
          </p>
          <p className="truncate text-[10px] text-muted">
            {MEDIA_KIND_LABELS[entry.kind]} ·{" "}
            {formatMediaSize(entry.file.size)} ·{" "}
            <StatusText entry={entry} />
          </p>
          {entry.error ? (
            <p className="text-[10px] font-medium text-danger" role="alert">
              {entry.error}
            </p>
          ) : null}
          {entry.status === "uploading" ? (
            <ProgressBar
              aria-label={`Subiendo ${entry.file.name}`}
              className="mt-1"
              color="accent"
              size="sm"
              value={entry.progress}
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {entry.status === "error" ? (
            <Button
              aria-label={`Reintentar ${entry.file.name}`}
              isDisabled={isUploading}
              isIconOnly
              onPress={onRetry}
              size="sm"
              variant="tertiary"
            >
              <RefreshIcon aria-hidden="true" className="size-3.5" />
            </Button>
          ) : null}
          <Button
            aria-label={`Quitar ${entry.file.name} de la cola`}
            isDisabled={isLocked}
            isIconOnly
            onPress={onRemove}
            size="sm"
            variant="tertiary"
          >
            <TrashIcon aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:max-w-md sm:grid-cols-[110px_1fr]">
        <Select
          aria-label={`Día de ${entry.file.name}`}
          isDisabled={isLocked}
          name={`day-${entry.id}`}
          value={String(entry.day)}
          onChange={(value) =>
            onUpdate({ day: Number(value ?? String(entry.day)) })
          }
        >
          <Select.Trigger className="py-2 text-xs">
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
          aria-label={`Descripción de ${entry.file.name}`}
          isDisabled={isLocked}
          name={`title-${entry.id}`}
          onChange={(value) => onUpdate({ title: value })}
          value={entry.title}
        >
          <Input
            className="py-2 text-xs"
            maxLength={160}
            placeholder="Descripción del archivo"
          />
        </TextField>
      </div>
    </li>
  );
}

function StatusText({ entry }: { entry: QueueEntry }) {
  if (entry.status === "uploading") {
    return <span className="text-accent-soft-foreground">{entry.progress}%</span>;
  }

  if (entry.status === "done") {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-accent-soft-foreground">
        <CheckIcon aria-hidden="true" className="size-3" />
        Publicado
      </span>
    );
  }

  if (entry.status === "error") {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-danger">
        <AlertCircleIcon aria-hidden="true" className="size-3" />
        Error
      </span>
    );
  }

  return <span>Pendiente</span>;
}
