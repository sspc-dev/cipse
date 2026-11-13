import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Skeleton } from "@heroui/react";
import { getMediaAccess } from "@/lib/features/auth/media-actions";
import { MediaAccessGate } from "@/lib/features/auth/components/media-access-gate";
import { MediaLogoutButton } from "@/lib/features/auth/components/media-logout-button";
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
    robots: { index: false, follow: false },
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
  const access = await getMediaAccess();

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_50%_at_50%_0%,rgba(29,75,68,0.18),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="ambient-drift-slow pointer-events-none absolute -top-32 right-1/4 size-96 rounded-full bg-tactical/15 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="ambient-drift pointer-events-none absolute top-1/3 -left-32 size-80 rounded-full bg-gold/10 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/imgs/texture.png')] bg-repeat grayscale bg-size-[960px] dark:filter-none opacity-[0.04] mask-[linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.55)_45%,transparent_85%)] dark:bg-[url('/imgs/texture-green.png')] dark:opacity-[0.08]"
        />

        <div className="max-w-10/12 mx-auto">
          <header className="relative z-10 border-b border-border/60 px-5 py-5 sm:px-8 lg:px-12">
            <div className="flex w-full flex-wrap items-center justify-between gap-4">
              <div className="reveal flex items-center gap-3">
                <Image
                  alt={dictionary.register.sealAlt}
                  className="h-11 w-auto"
                  height={120}
                  src="/imgs/XV CIPSE logos_vv1.webp"
                  width={120}
                />
                <div className="min-w-0 border-l border-border pl-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-ink/90">
                    {dictionary.common.event}
                  </p>
                  <p className="truncate font-display text-lg font-bold tracking-tight text-foreground">
                    {copy.title}
                  </p>
                </div>
              </div>
              <div className="reveal flex items-center gap-2 [animation-delay:150ms]">
                {access?.kind === "accredited" ? (
                  <MediaLogoutButton
                    ariaLabel={copy.access.logoutAria}
                    label={copy.access.logout}
                  />
                ) : null}
                <LanguageSwitcher
                  className="h-8 rounded-full px-3 text-[11px] font-semibold"
                  label={dictionary.common.languageSwitcherLabel}
                  locale={lang}
                  targetLabel={
                    getDictionary(lang === "es" ? "en" : "es").common
                      .languageName
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

          <div className="relative z-10 flex w-full flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
            {access ? (
              <>
                <Suspense fallback={<GallerySkeleton />}>
                  <MultimediaContent dictionary={dictionary} />
                </Suspense>

                <footer className="reveal mt-4 border-t border-border/60 pt-5 text-center text-[11px] text-muted/60 [animation-delay:200ms]">
                  {copy.footer}
                </footer>
              </>
            ) : (
              <MultimediaGate dictionary={dictionary} />
            )}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent"
          />
        </div>
      </div>
    </main>
  );
}

function MultimediaGate({
  dictionary,
}: {
  dictionary: ReturnType<typeof getDictionary>;
}) {
  const copy = dictionary.media.access;

  return (
    <section className="flex min-h-[60vh] items-center justify-center py-4">
      <div className="card-enter w-full max-w-md overflow-hidden rounded-[22px] border border-border bg-surface/85 shadow-[0_30px_80px_-30px_rgba(16,24,29,0.4)] backdrop-blur-xl dark:border-white/10 dark:shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)]">
        <div className="strip-shine h-1 w-full bg-linear-to-r from-tactical via-white to-guinda" />

        <div className="p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-ink/90">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
            {copy.heading}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {copy.description}
          </p>

          <div className="my-6 h-px bg-border" />

          <MediaAccessGate dictionary={dictionary} />
        </div>
      </div>
    </section>
  );
}

function GallerySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-105 rounded-2xl" />
      <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <Skeleton className="h-5 w-48 rounded-lg" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton className="aspect-4/3 rounded-xl" key={index} />
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
      <div className="reveal">
        <MultimediaHero copy={dictionary.media} items={items} />
      </div>
      <div className="reveal [animation-delay:150ms]">
        <MultimediaGallery copy={dictionary.media} items={items} />
      </div>
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
