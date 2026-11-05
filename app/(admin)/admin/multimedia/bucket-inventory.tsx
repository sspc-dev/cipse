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
import { FileTextIcon, VideoIcon } from "@/components/icons";

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
          className="size-11 shrink-0 rounded-lg border border-border object-cover"
          loading="lazy"
          src={src}
        />
      );
    }

    return (
      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-foreground/5">
        <video
          aria-hidden="true"
          className="size-full object-cover"
          muted
          playsInline
          preload="metadata"
          src={`${src}#t=0.1`}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <VideoIcon aria-hidden="true" className="size-3 text-white" />
        </span>
      </span>
    );
  }

  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-foreground/5 text-muted">
      <FileTextIcon aria-hidden="true" className="size-4" />
    </span>
  );
}

function StatusChip({ registered }: { registered: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider ${
        registered
          ? "border-border/70 bg-foreground/5 text-muted"
          : "border-gold-ink/50 bg-gold-ink/10 text-gold-ink"
      }`}
    >
      {registered ? "Registrado" : "Sin registrar"}
    </span>
  );
}

function BucketRowItem({ row }: { row: BucketRow }) {
  const object = row.object;
  const kind = mediaKindFromName(object.name);

  return (
    <li className="glass-soft flex flex-col gap-3 rounded-xl border border-border/70 px-4 py-3.5 transition-colors hover:border-accent/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Thumbnail row={row} />

        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="truncate">
              {row.item ? row.item.title : baseName(object.name)}
            </span>
            <StatusChip registered={row.item !== null} />
          </p>
          <p className="truncate text-[11px] text-muted">
            {kind ? MEDIA_KIND_LABELS[kind] : "Archivo"} ·{" "}
            {formatMediaSize(object.sizeBytes)} ·{" "}
            {dateTimeFormatter.format(object.createdAt)}
          </p>
          <p className="truncate font-mono text-[10px] text-muted/70">
            {object.name}
          </p>
        </div>
      </div>

      {row.item ? (
        <a
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-soft-foreground"
          href={mediaFileUrl(row.item.id)}
          rel="noreferrer"
          target="_blank"
        >
          Abrir
        </a>
      ) : (
        <a
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-soft-foreground"
          href={`/api/media/object?name=${encodeURIComponent(object.name)}`}
          rel="noreferrer"
          target="_blank"
        >
          Abrir
        </a>
      )}
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
      <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted">
        Inventario no disponible: el almacenamiento OCI no está configurado.
      </p>
    );
  }

  if (!inventory) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted">
        No fue posible leer el contenido del bucket. Intente de nuevo más
        tarde.
      </p>
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
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-[11px] leading-relaxed text-muted">
        {total.toLocaleString("es-MX")} objetos en el bucket ·{" "}
        {inventory.registered.length.toLocaleString("es-MX")} registrados ·{" "}
        {inventory.orphans.length.toLocaleString("es-MX")} sin registrar ·{" "}
        {inventory.broken.length.toLocaleString("es-MX")} registros sin objeto.
        {inventory.broken.length === 0 && inventory.orphans.length === 0
          ? " El bucket y los registros coinciden."
          : ""}
      </p>

      {inventory.broken.length > 0 ? (
        <div className="rounded-xl border border-dashed border-gold-ink/50 bg-gold-ink/5 px-4 py-3">
          <p className="text-[11px] font-semibold text-gold-ink">
            Registros cuyo objeto ya no está en el bucket
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {inventory.broken.map((item) => (
              <li key={item.id} className="truncate text-[11px] text-muted">
                {item.title}{" "}
                <span className="font-mono text-[10px] text-muted/70">
                  ({item.objectKey})
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] text-muted/80">
            Se sirven como no disponibles en la galería. Elimínelos desde el
            listado por día para limpiar el registro.
          </p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted">
          El bucket no contiene objetos.
        </p>
      ) : (
        groupRows(rows).map((group) => (
          <div key={group.key} className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {group.label}
              <span className="inline-flex shrink-0 items-center rounded-full border border-border/70 bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold leading-none tracking-[0.12em] normal-case text-muted">
                {group.rows.length}
              </span>
            </h3>
            <ul className="flex flex-col gap-2">
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
