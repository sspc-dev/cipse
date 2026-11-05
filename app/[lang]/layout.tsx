import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ThemeSwitcher } from "@/app/theme-switcher";
import { getDictionary, hasLocale, LOCALES } from "@/lib/i18n";
import { HtmlLangSync } from "./html-lang-sync";

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(
  props: LayoutProps<"/[lang]">,
): Promise<Metadata> {
  const { lang } = await props.params;
  const dictionary = getDictionary(hasLocale(lang) ? lang : "es");

  return {
    title: dictionary.metadata.rootTitle,
    description: dictionary.metadata.rootDescription,
  };
}

export default async function LanguageRootLayout(
  props: LayoutProps<"/[lang]">,
) {
  const { lang } = await props.params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dictionary = getDictionary(lang);

  return (
    <>
      <HtmlLangSync lang={lang} />
      {props.children}
      <Suspense fallback={null}>
        <ThemeSwitcher
          labels={{
            groupLabel: dictionary.common.themeLabel,
            light: dictionary.common.themeLight,
            dark: dictionary.common.themeDark,
            system: dictionary.common.themeSystem,
          }}
        />
      </Suspense>
    </>
  );
}
