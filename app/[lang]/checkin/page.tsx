import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/features/auth/actions";
import {
  attendanceDaysFor,
  findAccreditationByCode,
  findAttendanceToday,
} from "@/lib/features/checkin/datasource";
import { accessCodeSchema } from "@/lib/features/checkin/schemas";
import { AttendancePanel } from "@/lib/features/checkin/components/attendance-panel";
import { getDictionary, hasLocale } from "@/lib/i18n";
import type { Dictionary, Locale } from "@/lib/i18n";
import { CodeEntryForm } from "./code-entry-form";
import { ShieldIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function generateMetadata(
  props: PageProps<"/[lang]/checkin">,
): Promise<Metadata> {
  const { lang } = await props.params;
  const dictionary = getDictionary(hasLocale(lang) ? lang : "es");

  return {
    title: dictionary.metadata.checkinTitle,
    description: dictionary.metadata.checkinDescription,
    robots: { index: false, follow: false },
  };
}

const gridOverlayClass =
  "absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px]";

function CheckinSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="h-24 animate-pulse rounded-xl bg-foreground/[0.05]" />
      <div className="h-12 animate-pulse rounded-full bg-foreground/[0.05]" />
    </div>
  );
}

async function CheckinResolution({
  dictionary,
  locale,
  searchParams,
}: {
  dictionary: Dictionary;
  locale: Locale;
  searchParams: PageProps<"/[lang]/checkin">["searchParams"];
}) {
  const copy = dictionary.checkin;
  const { c: rawCode } = await searchParams;
  const accessCode = accessCodeSchema.safeParse(rawCode).data ?? null;

  const record =
    accessCode === null ? null : await findAccreditationByCode(accessCode);

  if (!record || accessCode === null) {
    return (
      <div className="flex flex-col gap-4">
        <p
          className="rounded-xl border border-border/60 bg-background/60 px-3.5 py-3 text-xs leading-relaxed text-muted"
          role="status"
        >
          {rawCode ? copy.invalidCode : copy.scanPrompt}
        </p>
        <CodeEntryForm dictionary={dictionary} />
      </div>
    );
  }

  const [todayAttendance, attendanceDays] = await Promise.all([
    findAttendanceToday(record.id),
    attendanceDaysFor(record.id),
  ]);

  return (
    <AttendancePanel
      accessCode={accessCode}
      adminSessionValid={(await getAdminSession()) !== null}
      delegado={{
        folio: `CIPSE-${String(record.id).padStart(4, "0")}`,
        name: record.name,
        lastname: record.lastname,
        country: record.country,
        status: record.status,
      }}
      dictionary={dictionary}
      initialAttendanceDays={attendanceDays}
      initialCheckedInAt={
        todayAttendance ? todayAttendance.toISOString() : null
      }
      locale={locale}
    />
  );
}

export default async function CheckinPage(props: PageProps<"/[lang]/checkin">) {
  const { lang } = await props.params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dictionary = getDictionary(lang);
  const copy = dictionary.checkin;
  const locale: Locale = lang;

  return (
    <main className="min-h-screen bg-background text-foreground dark:bg-[#070b11]">
      <div className="relative grid min-h-screen place-items-center px-4 py-10 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(85%_60%_at_50%_0%,rgba(29,75,68,0.22),transparent_70%)]" />
        <div className={gridOverlayClass} />

        <div className="relative z-10 w-full max-w-lg">
          <div className="card-enter overflow-hidden rounded-[22px] border border-border bg-surface/85 shadow-[0_30px_80px_-30px_rgba(16,24,29,0.35)] backdrop-blur-xl dark:border-white/10 dark:shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)]">
            <div className="h-1 w-full bg-linear-to-r from-tactical via-white to-guinda" />

            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src="/imgs/SSPC.png"
                    alt={copy.sealAlt}
                    width={120}
                    height={120}
                    className="h-14 w-auto shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-ink/90">
                      {dictionary.common.event}
                    </p>
                    <h1 className="mt-1 flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
                      <ShieldIcon className="size-4 text-tactical-bright" />
                      {copy.title}
                    </h1>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {copy.subtitle}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <LanguageSwitcher
                    className="h-8 rounded-full px-3 text-[11px] font-semibold"
                    label={dictionary.common.languageSwitcherLabel}
                    locale={locale}
                    targetLabel={
                      getDictionary(locale === "es" ? "en" : "es").common
                        .languageName
                    }
                  />
                </div>
              </div>

              <div className="my-6 h-px bg-border" />

              <Suspense fallback={<CheckinSkeleton />}>
                <CheckinResolution
                  dictionary={dictionary}
                  locale={locale}
                  searchParams={props.searchParams}
                />
              </Suspense>
            </div>
          </div>

          <footer className="mt-6 text-center text-[11px] text-muted/60">
            {copy.footer}
          </footer>
        </div>
      </div>
    </main>
  );
}
