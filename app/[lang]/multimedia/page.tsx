import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Skeleton } from "@heroui/react";
import { listEventMediaWithKeys } from "@/lib/features/media/datasource";
import {
  isMediaStorageConfigured,
  listBucketObjects,
} from "@/lib/features/media/storage";
import type { MediaItem } from "@/lib/features/media/types";
import { toMediaViewItem } from "@/lib/features/media/taxonomy";
import { MultimediaGallery } from "@/lib/features/media/components/multimedia-gallery";
import { MultimediaHero } from "@/lib/features/media/components/multimedia-hero";
import { getDictionary, hasLocale, localizedPath } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

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
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_50%_at_50%_0%,rgba(29,75,68,0.18),transparent_70%)]"
        />

        <header className="relative z-10 border-b border-border/60 px-5 py-5 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                alt={dictionary.register.sealAlt}
                className="h-11 w-auto"
                height={120}
                src="/imgs/XV CIPSE logos_vv1.webp"
                width={120}
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-ink/90">
                  {dictionary.common.event}
                </p>
                <p className="font-display text-lg font-bold tracking-tight text-foreground">
                  {copy.title}
                </p>
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

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
          <Suspense fallback={<GallerySkeleton />}>
            <MultimediaContent dictionary={dictionary} />
          </Suspense>

          <footer className="mt-4 border-t border-border/60 pt-5 text-center text-[11px] text-muted/60">
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
      <Skeleton className="h-[420px] rounded-2xl" />
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
        <Skeleton className="h-5 w-48 rounded-lg" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton className="aspect-[4/3] rounded-xl" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

async function MultimediaContent({
  dictionary,
}: {
  dictionary: ReturnType<typeof getDictionary>;
}) {
  await connection();
  const media = await listPublishedMedia();
  const items = media.map(toMediaViewItem);

  return (
    <>
      <MultimediaHero copy={dictionary.media} items={items} />
      <MultimediaGallery copy={dictionary.media} items={items} />
    </>
  );
}

/**
 * Material publicado: registros de `event_media` cuyo objeto exista en el
 * bucket. Si OCI no está configurado o la consulta falla, se conserva la
 * lista completa de registros (comportamiento histórico) en lugar de
 * vaciar la galería.
 */
async function listPublishedMedia(): Promise<MediaItem[]> {
  const registered = await listEventMediaWithKeys();

  if (!isMediaStorageConfigured()) {
    return registered;
  }

  try {
    const objects = await listBucketObjects("multimedia/");
    const present = new Set(objects.map((object) => object.name));
    return registered.filter((item) => present.has(item.objectKey));
  } catch (error) {
    console.error(
      "[multimedia] No se pudo verificar el bucket; se usan los registros:",
      error,
    );
    return registered;
  }
}
