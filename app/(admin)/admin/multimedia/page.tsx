import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/features/auth/actions";
import { listEventMediaWithKeys } from "@/lib/features/media/datasource";
import { MULTIMEDIA_DAYS } from "@/lib/features/media/days";
import {
  countDaysWithMedia,
  totalMediaBytes,
} from "@/lib/features/media/taxonomy";
import { formatMediaSize } from "@/lib/features/media/format";
import { isMediaStorageConfigured } from "@/lib/features/media/storage";
import {
  CalendarIcon,
  ImageIcon,
  VideoIcon,
} from "@/components/icons";
import Link from "next/link";
import { AdminShell } from "../admin-shell";
import { AdminHeader } from "../admin-header";
import { MediaDayFilter } from "./media-day-filter";
import { MediaUploadQueue } from "./media-upload-queue";

export const metadata: Metadata = {
  title: "Multimedia del panel — CIPSE XV",
  description: "Carga y administración del material multimedia del CIPSE XV.",
  robots: { index: false, follow: false },
};

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
    <div className="relative z-10 mx-auto w-full max-w-[1760px] px-5 py-12 sm:px-8 lg:px-12 xl:px-14">
      <div className="mb-8 h-20 animate-pulse rounded-md bg-surface/40" />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 animate-pulse rounded-md bg-surface/40" />
        <div className="h-28 animate-pulse rounded-md bg-surface/40" />
        <div className="h-28 animate-pulse rounded-md bg-surface/40" />
      </div>
      <div className="mb-4 h-48 animate-pulse rounded-md bg-surface/40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <div className="aspect-square animate-pulse rounded-md bg-surface/40" />
        <div className="aspect-square animate-pulse rounded-md bg-surface/40" />
        <div className="aspect-square animate-pulse rounded-md bg-surface/40" />
        <div className="aspect-square animate-pulse rounded-md bg-surface/40" />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-md border border-border/60 bg-surface/50 px-5 py-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-tactical/50 hover:shadow-[0_8px_32px_rgba(29,75,68,0.18)]">
      {/* Barra de acento superior */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-tactical/60 via-tactical to-tactical/60 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
      />
      {/* Brillo sutil en hover */}
      <span
        aria-hidden="true"
        className="absolute -right-6 -top-6 size-20 rounded-full bg-tactical/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {label}
          </dt>
          <dd className="font-mono text-3xl font-bold leading-none tracking-tight text-foreground">
            {value}
          </dd>
          {hint ? (
            <p className="text-[10px] leading-relaxed text-muted/70">{hint}</p>
          ) : null}
        </div>

        {icon ? (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-tactical/30 bg-tactical/10 text-tactical-bright transition-all duration-300 group-hover:bg-tactical/20 group-hover:shadow-[0_2px_12px_rgba(29,75,68,0.25)]">
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

async function MediaContent() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin");
  }

  const media = await listEventMediaWithKeys();
  const storageConfigured = isMediaStorageConfigured();

  return (
    <>
      <AdminHeader admin={admin} active="multimedia" />

      <div className="relative z-10 mx-auto w-full max-w-[1760px] px-5 py-10 sm:px-8 lg:px-12 xl:px-14">
        {/* Encabezado principal */}
        <section className="mb-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="flex items-center gap-3 font-display text-2xl font-bold tracking-tight text-foreground">
              <span className="flex size-9 items-center justify-center rounded-md border border-tactical/30 bg-tactical/10 text-tactical-bright">
                <ImageIcon className="size-4.5" aria-hidden="true" />
              </span>
              Multimedia del evento
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-muted">
              El material publicado aparece en la galería pública{" "}
              <Link
                className="font-semibold text-accent-soft-foreground underline-offset-2 transition-colors hover:text-tactical-bright hover:underline"
                href="/es/multimedia"
              >
                /es/multimedia
              </Link>
              , organizado por día.
            </p>
          </div>
        </section>

        {/* Estadísticas */}
        <dl className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<ImageIcon className="size-5" />}
            label="Archivos publicados"
            value={media.length.toLocaleString("es-MX")}
            hint="Material disponible en la galería pública"
          />
          <StatCard
            icon={<CalendarIcon className="size-5" />}
            label="Días con material"
            value={`${countDaysWithMedia(media)} de ${MULTIMEDIA_DAYS.length}`}
            hint="Días del congreso con archivos subidos"
          />
          <StatCard
            icon={<VideoIcon className="size-5" />}
            label="Tamaño total"
            value={formatMediaSize(totalMediaBytes(media))}
            hint="Espacio ocupado en almacenamiento"
          />
        </dl>

        {/* Carga de material */}
        <div className="mb-10">
          <MediaUploadQueue storageConfigured={storageConfigured} />
        </div>

        {/* Material por día — filtro en pestañas */}
        <section aria-label="Material por día" className="flex flex-col gap-4">
          <MediaDayFilter media={media} />
        </section>
      </div>
    </>
  );
}
