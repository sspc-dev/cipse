import { Geist, Geist_Mono, Manrope, Public_Sans } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const fontClassNames = `${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${publicSans.variable}`;
