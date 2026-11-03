import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { listEventMedia } from "@/lib/features/media/datasource";
import { MULTIMEDIA_DAYS } from "@/lib/features/media/days";
import { formatMediaSize } from "@/lib/features/media/format";
import type { MediaItem } from "@/lib/features/media/types";
import {
  formatMessage,
  getDictionary,
  hasLocale,
  localizedPath,
} from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { FileTextIcon } from "@/components/icons";

export async function generateMetadata(
  props: PageProps<"/[lang]/multimedia">,
): Promise<Metadata> {
  const { lang } = await props.params;
  const dictionary = getDictionary(hasLocale(lang) ? lang : "es");

  return {
    title: dictionary.metadata.mediaTitle,
    description: dictionary.metadata.mediaDescription,
  };
}

export default async function MultimediaPage(
  props: PageProps<"/[lang]/multimedia">,
) {
  const { lang } = await props.params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dictionary = getDictionary(lang);
  const copy = dictionary.media;

  return (
    <main className="min-h-screen bg-background text-foreground dark:bg-[#070b11]">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_50%_at_50%_0%,rgba(29,75,68,0.18),transparent_70%)]" />

        <header className="relative z-10 border-b border-border/60 px-5 py-5 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                alt={dictionary.register.sealAlt}
                className="h-11 w-auto"
                height={120}
                src="/imgs/SSPC.png"
                width={120}
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-ink/90">
                  {dictionary.common.event}
                </p>
                <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
                  {copy.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher
                className="h-8 rounded-full px-3 text-[11px] font-semibold"
                label={dictionary.common.languageSwitcherLabel}
                locale={lang}
                targetLabel={
                  getDictionary(lang === "es" ? "en" : "es").common.languageName
                }
              />
              <a
                className="rounded-full border border-border px-3.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-soft-foreground"
                href={localizedPath(lang, "/register")}
              >
                {dictionary.common.registerLink}
              </a>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12">
          <Suspense fallback={<GallerySkeleton />}>
            <GalleryContent dictionary={dictionary} />
          </Suspense>

          <footer className="mt-10 border-t border-border/60 pt-5 text-center text-[11px] text-muted/60">
            {copy.footer}
          </footer>
        </div>
      </div>
    </main>
  );
}

function GallerySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {[0, 1].map((index) => (
        <div key={index} className="flex flex-col gap-3">
          <div className="h-4 w-24 animate-pulse rounded-full bg-foreground/5" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((cell) => (
              <div
                key={cell}
                className="aspect-[4/3] animate-pulse rounded-xl bg-foreground/5"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ImageCard({
  item,
  openAriaTemplate,
}: {
  item: MediaItem;
  openAriaTemplate: string;
}) {
  return (
    <a
      aria-label={formatMessage(openAriaTemplate, { title: item.title })}
      className="group relative block overflow-hidden rounded-xl border border-border bg-surface"
      href={mediaFileUrl(item.id)}
      rel="noreferrer"
      target="_blank"
    >
      {/* Archivo servido por route handler; no pasa por optimización. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={item.title}
        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        src={mediaFileUrl(item.id)}
      />
      <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-3 pt-6 pb-2 text-[11px] font-semibold text-white">
        {item.title}
      </span>
    </a>
  );
}

function VideoCard({ item }: { item: MediaItem }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-surface">
      <video
        className="aspect-video w-full bg-black"
        controls
        preload="metadata"
        src={mediaFileUrl(item.id)}
      />
      <figcaption className="px-3 py-2 text-[11px] font-semibold text-foreground">
        {item.title}
      </figcaption>
    </figure>
  );
}

function DocumentCard({
  item,
  kindLabel,
}: {
  item: MediaItem;
  kindLabel: string;
}) {
  return (
    <a
      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors hover:border-accent"
      href={mediaFileUrl(item.id)}
      rel="noreferrer"
      target="_blank"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-foreground/5 text-muted">
        <FileTextIcon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">
          {item.title}
        </span>
        <span className="text-[11px] text-muted">
          {kindLabel} · {formatMediaSize(item.sizeBytes)}
        </span>
      </span>
    </a>
  );
}

function DayGallery({
  copy,
  label,
  items,
}: {
  copy: ReturnType<typeof getDictionary>["media"];
  label: string;
  items: MediaItem[];
}) {
  const images = items.filter((item) => item.kind === "image");
  const videos = items.filter((item) => item.kind === "video");
  const documents = items.filter((item) => item.kind === "document");

  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </h2>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted">
          {formatMessage(copy.empty, { day: label.toLowerCase() })}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((item) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  openAriaTemplate={copy.openAria}
                />
              ))}
            </div>
          ) : null}

          {videos.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {videos.map((item) => (
                <VideoCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}

          {documents.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {documents.map((item) => (
                <DocumentCard
                  key={item.id}
                  item={item}
                  kindLabel={copy.kinds[item.kind]}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function dayLabel(
  day: number,
  template: string,
): string {
  return formatMessage(template, { n: day });
}

async function GalleryContent({
  dictionary,
}: {
  dictionary: ReturnType<typeof getDictionary>;
}) {
  await connection();
  const media = await listEventMedia();
  const copy = dictionary.media;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          {copy.galleryHeading}
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
          {copy.galleryDescription}
        </p>
      </div>

      {MULTIMEDIA_DAYS.map((day) => (
        <DayGallery
          key={day.value}
          copy={copy}
          items={media.filter((item) => item.day === day.value)}
          label={dayLabel(day.value, copy.dayLabel)}
        />
      ))}
    </div>
  );
}

function mediaFileUrl(id: number): string {
  return `/multimedia/file/${id}`;
}
