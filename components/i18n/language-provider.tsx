"use client";

// Makes the active locale + dictionary available to every Client Component.
// The server seeds it from the cookie (in app/layout.tsx) so the first paint is
// already correct — no flash, no hydration mismatch.

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { dirForLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type I18nValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
};

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value: I18nValue = { locale, dir: dirForLocale(locale), t: dict };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <LanguageProvider>.");
  }
  return ctx;
}
