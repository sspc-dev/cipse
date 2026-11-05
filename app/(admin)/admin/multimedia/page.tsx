import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/features/auth/actions";
import { listEventMediaWithKeys } from "@/lib/features/media/datasource";
import { MULTIMEDIA_DAYS } from "@/lib/features/media/days";
import {
  formatMediaSize,
  MEDIA_KIND_LABELS,
  mediaFileUrl,
} from "@/lib/features/media/format";
import {
  countDaysWithMedia,
  mediaFormatTag,
  totalMediaBytes,
} from "@/lib/features/media/taxonomy";
import {
  isMediaStorageConfigured,
  listBucketObjects,
} from "@/lib/features/media/storage";
import {
  reconcileMediaInventory,
  type MediaInventory,
} from "@/lib/features/media/inventory";
import type { MediaItem } from "@/lib/features/media/types";
import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import {
  CalendarIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
} from "@/components/icons";
import Link from "next/link";
import { AdminShell } from "../admin-shell";
import { AdminHeader } from "../admin-header";
import { BucketInventory } from "./bucket-inventory";
import { MediaDeleteButton } from "./media-delete-button";
import { MediaMetaEdit } from "./media-meta-edit";
import { MediaUploadQueue } from "./media-upload-queue";

export const metadata: Metadata = {
  title: "Multimedia del panel — CIPSE XV",
  description: "Carga y administración del material multimedia del CIPSE XV.",
  robots: { index: false, follow: false },
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: CONGRESS_TIME_ZONE,
});

export default function AdminMediaPage() {
  return (
    <AdminShell>
      <Suspense fallback={<MediaSkeleton />}>
        <MediaContent />
      </Suspense>
    </AdminShell>
  );
}

function MediaSkeleton() {
  return (
    <div className="relative z-10 mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 h-24 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="mb-6 h-48 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="h-56 animate-pulse rounded-2xl bg-foreground/5" />
    </div>
  );
}

function KindIcon({ kind }: { kind: MediaItem["kind"] }) {
  if (kind === "image") return <ImageIcon className="size-4" aria-hidden="true" />;
  if (kind === "video") return <VideoIcon className="size-4" aria-hidden="true" />;
  return <FileTextIcon className="size-4" aria-hidden="true" />;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-soft rounded-xl border border-border/70 px-4 py-3">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-mono text-lg font-bold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function MediaAdminItem({ item }: { item: MediaItem }) {
  return (
    <li className="glass-soft flex flex-col gap-3 rounded-xl border border-border/70 px-4 py-3.5 transition-colors hover:border-accent/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {item.kind === "image" ? (
          /* Archivo servido por route handler; no pasa por optimización. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            aria-hidden="true"
            className="size-14 shrink-0 rounded-lg border border-border object-cover"
            loading="lazy"
            src={mediaFileUrl(item.id)}
          />
        ) : item.kind === "video" ? (
          <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-foreground/5">
            <video
              preload="metadata"
              src={`${mediaFileUrl(item.id)}#t=0.1`}
              className="size-full object-cover"
              aria-hidden="true"
              muted
              playsInline
            />
            <VideoPlayBadge />
          </span>
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-foreground/5 text-muted">
            <KindIcon kind={item.kind} />
          </span>
        )}

        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="truncate">{item.title}</span>
            <span className="inline-flex shrink-0 items-center rounded-full border border-border/70 bg-foreground/5 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-muted normal-case">
              {mediaFormatTag(item)}
            </span>
          </p>
          <p className="truncate text-[11px] text-muted">
            {MEDIA_KIND_LABELS[item.kind]} · {formatMediaSize(item.sizeBytes)} ·{" "}
            {dateTimeFormatter.format(item.createdAt)}
          </p>
          <p className="truncate text-[10px] text-muted/70">
            {item.originalName}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-soft-foreground"
          href={mediaFileUrl(item.id)}
          rel="noreferrer"
          target="_blank"
        >
          Abrir
        </a>
        <MediaMetaEdit
          day={item.day}
          fileName={item.originalName}
          id={item.id}
          title={item.title}
        />
        <MediaDeleteButton id={item.id} title={item.title} />
      </div>
    </li>
  );
}

function VideoPlayBadge() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
      <span className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white">
        <VideoIcon aria-hidden="true" className="size-3" />
      </span>
    </span>
  );
}

async function MediaContent() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin");
  }

  const media = await listEventMediaWithKeys();
  const storageConfigured = isMediaStorageConfigured();

  let inventory: MediaInventory | null = null;

  if (storageConfigured) {
    try {
      const bucketObjects = await listBucketObjects("multimedia/");
      inventory = reconcileMediaInventory(bucketObjects, media);
    } catch (error) {
      console.error(
        "[admin/multimedia] No se pudo leer el inventario del bucket:",
        error,
      );
    }
  }

  const bucketTotal = inventory
    ? inventory.registered.length + inventory.orphans.length
    : null;

  return (
    <>
      <AdminHeader admin={admin} active="multimedia" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12">
        <section className="mb-8 flex flex-col gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              Multimedia del evento
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
              El material publicado aparece en la galería pública{" "}
              <Link className="font-semibold text-accent-soft-foreground underline-offset-2 hover:underline" href="/es/multimedia">
                /es/multimedia
              </Link>
              , organizado por día.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Archivos publicados"
              value={media.length.toLocaleString("es-MX")}
            />
            <StatCard
              icon={<CalendarIcon className="size-3.5" />}
              label="Días con material"
              value={`${countDaysWithMedia(media)} de ${MULTIMEDIA_DAYS.length}`}
            />
            <StatCard
              label="Tamaño total"
              value={formatMediaSize(totalMediaBytes(media))}
            />
            <StatCard
              label="Objetos en bucket"
              value={
                bucketTotal === null
                  ? "—"
                  : bucketTotal.toLocaleString("es-MX")
              }
            />
          </dl>

          <MediaUploadQueue storageConfigured={storageConfigured} />
        </section>

        <section aria-label="Material por día" className="flex flex-col gap-6">
          {MULTIMEDIA_DAYS.map((day) => {
            const items = media.filter((item) => item.day === day.value);

            return (
              <div key={day.value} className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {day.label}
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold leading-none tracking-[0.12em] normal-case text-muted">
                    {items.length}
                  </span>
                </h2>

                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted">
                    Sin material publicado para {day.label.toLowerCase()}.{" "}
                    <Link
                      className="font-semibold text-accent-soft-foreground underline-offset-2 hover:underline"
                      href="#cargar-material"
                    >
                      Súbelo desde la sección de carga.
                    </Link>
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {items.map((item) => (
                      <MediaAdminItem key={item.id} item={item} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>

        <section
          aria-label="Contenido del bucket"
          className="mt-8 flex flex-col gap-3"
        >
          <h2 className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Contenido del bucket
          </h2>
          <BucketInventory
            inventory={inventory}
            storageConfigured={storageConfigured}
          />
        </section>
      </div>
    </>
  );
}
