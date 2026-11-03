import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Providers } from "@/app/providers";
import { ThemeSwitcher } from "@/app/theme-switcher";
import { fontClassNames } from "@/lib/fonts";
import { getDictionary, hasLocale, LOCALES } from "@/lib/i18n";
import "@/app/globals.css";

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
    <html
      lang={lang}
      className={`${fontClassNames} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Providers>
          {props.children}
          <ThemeSwitcher
            labels={{
              groupLabel: dictionary.common.themeLabel,
              light: dictionary.common.themeLight,
              dark: dictionary.common.themeDark,
              system: dictionary.common.themeSystem,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
