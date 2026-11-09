import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MedalIcon } from "@/components/icons";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { CredentialGate } from "./credential-gate";

export async function generateMetadata(
  props: PageProps<"/[lang]/register">,
): Promise<Metadata> {
  const { lang } = await props.params;
  const dictionary = getDictionary(hasLocale(lang) ? lang : "es");

  return {
    title: dictionary.metadata.registerTitle,
    description: dictionary.metadata.registerDescription,
  };
}

const gridOverlayClass =
  "absolute inset-0 opacity-[0.14] bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px] mask-[radial-gradient(85%_75%_at_50%_40%,black,transparent)]";

/*
 * Nota sobre alertas ZAP (10024 y 10031): esta página no refleja query
 * params. El formulario envía por Server Actions (POST) y el catálogo de
 * países es estático (ISO completo), por lo que `<option value="AF">` existe
 * siempre y no proviene del parámetro `country`. Los sondeos de ZAP con
 * `?email=...` en la URL son artefactos del escáner, no comportamiento real.
 */

export default async function RegisterPage(
  props: PageProps<"/[lang]/register">,
) {
  const { lang } = await props.params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dictionary = getDictionary(lang);
  const copy = dictionary.register;
  const targetLocale = lang === "es" ? "en" : "es";
  const targetLabel = getDictionary(targetLocale).common.languageName;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_0%_0%,#123c35_0%,#08110f_52%,#06090e_100%)]" />
          <Image
            src="/imgs/bg-register.jpeg"
            alt={copy.coverAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="ken-burns absolute inset-0 object-cover object-center opacity-[0.45]"
            priority
          />
          <div className={gridOverlayClass} />
          <div className="absolute -top-24 -left-24 size-80 rounded-full bg-guinda/25 blur-[120px]" />
          <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-tactical-bright/25 blur-[130px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-[#06090e] via-[#06090e]/40 to-transparent" />
          <div className="reveal flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-white/20 px-3 py-2 backdrop-blur-3xl shadow">
            <Image
              src="/imgs/SSPC_logo.png"
              alt={copy.sspcLogoAlt}
              priority
              width={200}
              height={200}
              className="h-12 w-auto"
            />
            <Image
              src="/imgs/logo_gob_mx.png"
              alt={copy.govLogoAlt}
              priority
              width={150}
              height={150}
              className="h-10 w-auto"
            />
          </div>
          <div className="relative z-10 mt-auto flex flex-col gap-6 pt-16">
            <div className="reveal inline-flex w-fit items-center gap-2.5 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 backdrop-blur [animation-delay:250ms]">
              <MedalIcon className="size-4 text-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                {dictionary.common.event}
              </span>
            </div>

            <p className="reveal max-w-xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white [animation-delay:400ms] xl:text-5xl">
              <b className="drop-shadow-lg drop-shadow-gold/70 text-gold font-extrabold text-7xl">
                {" "}
                XV{" "}
              </b>
              {copy.heroTitle}
            </p>
          </div>
        </aside>

        <section className="relative flex min-h-screen flex-col bg-background dark:bg-[#070b11] lg:border-l lg:border-border">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_0%,rgba(29,75,68,0.2),transparent_70%)]" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-3/5 bg-[url('/imgs/texture.png')] bg-repeat grayscale dark:filter-none opacity-[0.1] bg-size-[960px] mask-[radial-gradient(ellipse_120%_100%_at_100%_30%,black_0%,rgba(0,0,0,0.9)_45%,transparent_75%)] dark:bg-[url('/imgs/texture-green.png')] dark:opacity-[0.14]"
          />

          <div className="relative z-10 lg:hidden">
            <div className="relative h-44 w-full overflow-hidden sm:h-52">
              <Image
                src="/imgs/bg-register.jpeg"
                alt={copy.coverAlt}
                fill
                sizes="100vw"
                className="object-cover object-center"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-background/25 dark:from-[#070b11] dark:via-[#070b11]/60 dark:to-[#070b11]/25" />
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 px-5 pb-4 sm:px-8">
                <div className="reveal flex w-fit items-center gap-2.5 rounded-full border border-gold/25 bg-black/40 px-3.5 py-1.5 backdrop-blur [animation-delay:150ms]">
                  <MedalIcon className="size-4 text-gold" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                    {dictionary.common.event}
                  </span>
                </div>
                <span className="reveal text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 [animation-delay:300ms]">
                  {copy.orgLine}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
            <div className="w-full max-w-2xl xl:max-w-3xl">
              <div className="card-enter overflow-hidden rounded-[22px] border border-border bg-surface/85 shadow-[0_30px_80px_-30px_rgba(16,24,29,0.35)] backdrop-blur-xl dark:shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)]">
                <div className="strip-shine relative h-1 w-full bg-linear-to-r from-tactical via-white to-guinda" />

                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="reveal flex items-center gap-2">
                    <Image
                      src="/imgs/XV CIPSE logos_vv1.webp"
                      alt={copy.sealAlt}
                      width={120}
                      height={120}
                    />

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-ink/90">
                        {copy.badge}
                      </p>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[32px]">
                {copy.heading}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">
                {copy.subheading}
              </p>
                    </div>
                  </div>

                  <div className="reveal my-6 h-px bg-border [animation-delay:150ms]" />

                  <div className="reveal [animation-delay:250ms]">
                    <CredentialGate dictionary={dictionary} locale={lang} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="reveal relative z-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 px-5 py-5 text-[11px] text-muted/60 [animation-delay:500ms] sm:flex-row sm:px-8 lg:px-12 xl:px-16">
            <span className="inline-flex items-center gap-2">
              {copy.orgLine}
            </span>
            <div className="flex items-center gap-3">
              <LanguageSwitcher
                className="h-7 rounded-full px-3 text-[11px] font-semibold"
                label={dictionary.common.languageSwitcherLabel}
                locale={lang}
                targetLabel={targetLabel}
              />
              <span>{copy.footer}</span>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
