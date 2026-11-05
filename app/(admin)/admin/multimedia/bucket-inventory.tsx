import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import { MULTIMEDIA_DAYS, mediaDayLabel } from "@/lib/features/media/days";
import {
  formatMediaSize,
  MEDIA_KIND_LABELS,
  mediaFileUrl,
} from "@/lib/features/media/format";
import type {
  MediaInventory,
  RegisteredMediaItem,
} from "@/lib/features/media/inventory";
import type { MediaObjectSummary } from "@/lib/features/media/storage";
import { mediaKindFromName } from "@/lib/features/media/types";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  VideoIcon,
} from "@/components/icons";

/**
 * Inventario del bucket para el panel admin: todos los objetos reales de
 * OCI con su estado de registro (registrado / sin registrar) y el detalle
 * de registros cuyo objeto ya no existe en el bucket.
 */

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: CONGRESS_TIME_ZONE,
});

type BucketRow = {
  object: MediaObjectSummary;
  item: RegisteredMediaItem | null;
};

function objectDay(name: string): number | null {
  const match = /^multimedia\/dia-(\d+)\//.exec(name);
  return match ? Number(match[1]) : null;
}

function baseName(name: string): string {
  return name.slice(name.lastIndexOf("/") + 1);
}

function groupRows(rows: BucketRow[]): Array<{
  key: string;
  label: string;
  rows: BucketRow[];
}> {
  const knownDays = MULTIMEDIA_DAYS.map((day) => ({
    key: `day-${day.value}`,
    label: day.label,
    rows: rows.filter((row) => objectDay(row.object.name) === day.value),
  }));

  const knownValues = new Set<number>(
    MULTIMEDIA_DAYS.map((day) => day.value),
  );
  const unknown = rows.filter((row) => {
    const day = objectDay(row.object.name);
    return day !== null && !knownValues.has(day);
  });
  const others = rows.filter((row) => objectDay(row.object.name) === null);

  const unknownByKey = new Map<number, BucketRow[]>();
  for (const row of unknown) {
    const day = objectDay(row.object.name) as number;
    unknownByKey.set(day, [...(unknownByKey.get(day) ?? []), row]);
  }
  const unknownGroups = [...unknownByKey.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, dayRows]) => ({
      key: `unknown-${day}`,
      label: mediaDayLabel(day),
      rows: dayRows,
    }));

  const otherGroups =
    others.length > 0
      ? [{ key: "others", label: "Otras rutas", rows: others }]
      : [];

  return [...knownDays, ...unknownGroups, ...otherGroups].filter(
    (group) => group.rows.length > 0,
  );
}

function Thumbnail({ row }: { row: BucketRow }) {
  const kind = mediaKindFromName(row.object.name);

  if (kind === "image" || kind === "video") {
    const src = row.item
      ? mediaFileUrl(row.item.id)
      : `/api/media/object?name=${encodeURIComponent(row.object.name)}`;

    if (kind === "image") {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden="true"
          className="size-16 shrink-0 rounded-lg border border-border/60 object-cover"
          loading="lazy"
          src={src}
        />
      );
    }

    return (
      <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-foreground/5">
        <video
          aria-hidden="true"
          className="size-full object-cover"
          muted
          playsInline
          preload="metadata"
          src={`${src}#t=0.1`}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
          <VideoIcon aria-hidden="true" className="size-4 text-white" />
        </span>
      </span>
    );
  }

  return (
    <span className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-foreground/5 text-muted">
      <FileTextIcon aria-hidden="true" className="size-5" />
    </span>
  );
}

function StatusChip({ registered }: { registered: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
        registered
          ? "border-accent/40 bg-accent-soft text-accent-soft-foreground"
          : "border-gold-ink/40 bg-gold-ink/10 text-gold-ink"
      }`}
    >
      {registered ? (
        <CheckIcon className="size-2.5" aria-hidden="true" />
      ) : (
        <AlertCircleIcon className="size-2.5" aria-hidden="true" />
      )}
      {registered ? "Registrado" : "Sin registrar"}
    </span>
  );
}

function BucketRowItem({ row }: { row: BucketRow }) {
  const object = row.object;
  const kind = mediaKindFromName(object.name);
  const href = row.item
    ? mediaFileUrl(row.item.id)
    : `/api/media/object?name=${encodeURIComponent(object.name)}`;

  return (
    <li className="group relative overflow-hidden rounded-md border border-border/60 bg-surface/50 shadow-sm transition-all duration-300 hover:border-tactical/40 hover:shadow-[0_4px_24px_rgba(29,75,68,0.12)]">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tactical/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
        <Thumbnail row={row} />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-base font-semibold leading-snug text-foreground">
              {row.item ? row.item.title : baseName(object.name)}
            </p>
            <StatusChip registered={row.item !== null} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
            <span>{kind ? MEDIA_KIND_LABELS[kind] : "Archivo"}</span>
            <span className="font-mono text-[10px] text-muted/60">
              {formatMediaSize(object.sizeBytes)}
            </span>
            <span>{dateTimeFormatter.format(object.createdAt)}</span>
          </div>

          <p className="truncate font-mono text-[10px] text-muted/50">
            {object.name}
          </p>
        </div>

        <a
          aria-label={`Abrir ${row.item ? row.item.title : baseName(object.name)} en pestaña nueva`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full border border-border/70 px-3.5 text-[11px] font-semibold text-foreground transition-all duration-200 hover:-translate-y-px hover:border-tactical/50 hover:bg-tactical/5 hover:text-tactical-bright focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-1 sm:self-center"
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          <EyeIcon className="size-3.5" aria-hidden="true" />
          Abrir
        </a>
      </div>
    </li>
  );
}

export function BucketInventory({
  storageConfigured,
  inventory,
}: {
  storageConfigured: boolean;
  inventory: MediaInventory | null;
}) {
  if (!storageConfigured) {
    return (
      <div className="rounded-md border border-dashed border-gold-ink/40 bg-gold-ink/5 px-5 py-8 text-center">
        <AlertCircleIcon
          className="mx-auto mb-2 size-5 text-gold-ink"
          aria-hidden="true"
        />
        <p className="text-xs text-muted">
          Inventario no disponible: el almacenamiento OCI no está configurado.
        </p>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-surface/30 px-5 py-8 text-center">
        <FileTextIcon
          className="mx-auto mb-2 size-5 text-muted/40"
          aria-hidden="true"
        />
        <p className="text-xs text-muted">
          No fue posible leer el contenido del bucket. Intente de nuevo más
          tarde.
        </p>
      </div>
    );
  }

  const total = inventory.registered.length + inventory.orphans.length;
  const rows: BucketRow[] = [
    ...inventory.registered.map((item) => ({
      object: item.bucketObject,
      item,
    })),
    ...inventory.orphans.map((object) => ({ object, item: null })),
  ].sort((a, b) => b.object.createdAt.getTime() - a.object.createdAt.getTime());

  return (
    <div className="flex flex-col gap-5">
      {/* Resumen */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono font-bold text-foreground">
            {total.toLocaleString("es-MX")}
          </span>
          objetos en el bucket
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-border/60" />
        <span className="inline-flex items-center gap-1.5">
          <CheckIcon className="size-3 text-accent-soft-foreground" aria-hidden="true" />
          <span className="font-mono font-bold text-foreground">
            {inventory.registered.length.toLocaleString("es-MX")}
          </span>
          registrados
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-border/60" />
        <span className="inline-flex items-center gap-1.5">
          <AlertCircleIcon className="size-3 text-gold-ink" aria-hidden="true" />
          <span className="font-mono font-bold text-foreground">
            {inventory.orphans.length.toLocaleString("es-MX")}
          </span>
          sin registrar
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-border/60" />
        <span className="inline-flex items-center gap-1.5">
          <AlertCircleIcon className="size-3 text-danger" aria-hidden="true" />
          <span className="font-mono font-bold text-foreground">
            {inventory.broken.length.toLocaleString("es-MX")}
          </span>
          registros sin objeto
        </span>
        {inventory.broken.length === 0 && inventory.orphans.length === 0 ? (
          <span className="inline-flex items-center gap-1.5 text-accent-soft-foreground">
            <CheckIcon className="size-3" aria-hidden="true" />
            El bucket y los registros coinciden.
          </span>
        ) : null}
      </div>

      {/* Registros rotos */}
      {inventory.broken.length > 0 ? (
        <div className="rounded-md border border-gold-ink/40 bg-gold-ink/5 px-5 py-4">
          <p className="flex items-center gap-2 text-[11px] font-semibold text-gold-ink">
            <AlertCircleIcon className="size-3.5" aria-hidden="true" />
            Registros cuyo objeto ya no está en el bucket
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {inventory.broken.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline gap-2 truncate text-[11px] text-muted"
              >
                <span className="truncate">{item.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted/50">
                  ({item.objectKey})
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[10px] leading-relaxed text-muted/80">
            Se sirven como no disponibles en la galería. Elimínelos desde el
            listado por día para limpiar el registro.
          </p>
        </div>
      ) : null}

      {/* Objetos */}
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 bg-surface/30 px-5 py-8 text-center">
          <FileTextIcon
            className="mx-auto mb-2 size-5 text-muted/40"
            aria-hidden="true"
          />
          <p className="text-xs text-muted">El bucket no contiene objetos.</p>
        </div>
      ) : (
        groupRows(rows).map((group) => (
          <div key={group.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h3 className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                <CalendarIcon className="size-3.5" aria-hidden="true" />
                {group.label}
                <span className="inline-flex items-center rounded-full border border-border/60 bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold leading-none tracking-[0.12em] normal-case text-muted">
                  {group.rows.length}
                </span>
              </h3>
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent"
              />
            </div>
            <ul className="flex flex-col gap-3">
              {group.rows.map((row) => (
                <BucketRowItem key={row.object.name} row={row} />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
