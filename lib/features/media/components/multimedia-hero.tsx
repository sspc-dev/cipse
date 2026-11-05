import { type Dictionary } from "@/lib/i18n";
import {
  countAvailableKinds,
  countDaysWithMedia,
  pickFeaturedMedia,
  type MediaViewItem,
} from "../taxonomy";
import { FeaturedMediaCard } from "./featured-media-card";

type MultimediaHeroProps = {
  items: MediaViewItem[];
  copy: Dictionary["media"];
};

export function MultimediaHero({ items, copy }: MultimediaHeroProps) {
  const featured = pickFeaturedMedia(items);

  const stats = [
    {
      value: String(items.length).padStart(2, "0"),
      label: copy.stats.files,
    },
    {
      value: String(countDaysWithMedia(items)).padStart(2, "0"),
      label: copy.stats.days,
    },
    {
      value: String(countAvailableKinds(items)).padStart(2, "0"),
      label: copy.stats.formats,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-2xl backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90 [background-image:linear-gradient(to_right,rgba(197,155,39,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(29,75,68,0.06)_1px,transparent_1px)] [background-size:80px_80px]"
      />
      <div
        aria-hidden="true"
        className="ambient-drift pointer-events-none absolute -top-32 right-1/4 size-96 rounded-full bg-tactical/20 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="ambient-drift-slow pointer-events-none absolute -bottom-32 left-10 size-80 rounded-full bg-gold/10 blur-[90px]"
      />

      <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-12 lg:items-center lg:gap-10 lg:p-11">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-gold-ink uppercase">
            <span
              aria-hidden="true"
              className="size-1.5 animate-pulse rounded-full bg-emerald-400"
            />
            {copy.eyebrow}
          </span>

          <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {copy.heroLine1}
            <br />
            <span className="bg-linear-to-r from-gold via-gold-ceremonial to-amber-200 bg-clip-text text-transparent">
              {copy.heroHighlight}
            </span>
            <br />
            {copy.heroLine2}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
            {copy.heroDescription}
          </p>

          <dl className="mt-7 grid max-w-md grid-cols-3 gap-4 border-t border-border/60 pt-5">
            {stats.map((stat) => (
              <div className="flex flex-col-reverse gap-1" key={stat.label}>
                <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                  {stat.label}
                </dt>
                <dd className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <FeaturedMediaCard copy={copy} item={featured} />
        </div>
      </div>
    </section>
  );
}
