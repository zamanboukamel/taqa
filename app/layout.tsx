import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Fraunces,
  IBM_Plex_Sans_Arabic,
  Amiri,
} from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { dirForLocale } from "@/lib/i18n/config";
import { LanguageProvider } from "@/components/i18n/language-provider";

// UI / body — clean grotesque (Vercel-ish), kept from the original.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Data / eyebrows / calorie counters — instrument feel (Oura/Whoop).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display — a characterful variable serif. High optical contrast reads premium
// against the dark "stadium" base; far from any default sans-only sports look.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

// Arabic body — a clean geometric Arabic that mirrors Geist's modern grotesque
// feel, so the UI looks identical in either language.
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

// Arabic display — an elegant Arabic serif standing in for Fraunces on headings.
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "ar"
    ? {
        title: "طاقة — وقود اللاعب",
        description:
          "خطط تغذية مبنية بالذكاء الاصطناعي تراعي التدريب، لأكاديميات الرياضة في الخليج. طاقة تعني الطاقة.",
      }
    : {
        title: "Taqa — Fuel the Athlete",
        description:
          "AI-built, training-aware nutrition plans for GCC sports academies. Taqa (طاقة) means energy.",
      };
}

// Dark status bar to match the app chrome.
export const viewport: Viewport = {
  themeColor: "#0b1410",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      dir={dirForLocale(locale)}
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${plexArabic.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider locale={locale} dict={dict}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
