import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Public_Sans } from "next/font/google";
import { ThemeSwitcher } from "./theme-switcher";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Registro de acreditación — CIPSE XV",
  description:
    "Solicite su acreditación para el CIPSE XV, Congreso Internacional Policial contra el Secuestro y la Extorsión, México 2026. Organizado por la SSPC.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${publicSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Providers>
          {children}
          <ThemeSwitcher />
        </Providers>
      </body>
    </html>
  );
}
