import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/features/auth/actions";
import { listEventMedia } from "@/lib/features/media/datasource";
import { MULTIMEDIA_DAYS } from "@/lib/features/media/days";
import {
  formatMediaSize,
  MEDIA_KIND_LABELS,
  mediaFileUrl,
} from "@/lib/features/media/format";
import { isMediaStorageConfigured } from "@/lib/features/media/storage";
import type { MediaItem } from "@/lib/features/media/types";
import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import { FileTextIcon, ImageIcon, VideoIcon } from "@/components/icons";
import Link from "next/link";
import { AdminShell } from "../admin-shell";
import { AdminHeader } from "../admin-header";
import { MediaDeleteButton } from "./media-delete-button";
import { UploadMediaForm } from "./upload-media-form";

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
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-foreground/5 text-muted">
            <KindIcon kind={item.kind} />
          </span>
        )}

        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {item.title}
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
        <MediaDeleteButton id={item.id} title={item.title} />
      </div>
    </li>
  );
}

async function MediaContent() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin");
  }

  const media = await listEventMedia();
  const storageConfigured = isMediaStorageConfigured();

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
          <UploadMediaForm storageConfigured={storageConfigured} />
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
                    Sin material publicado para {day.label.toLowerCase()}.
                    Seleccione este día en el formulario superior para
                    publicarlo.
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
      </div>
    </>
  );
}
