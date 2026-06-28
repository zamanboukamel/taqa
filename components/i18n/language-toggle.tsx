"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, dirForLocale, type Locale } from "@/lib/i18n/config";
import { useI18n } from "./language-provider";

// One-tap English ⇄ Arabic switch. Writes the locale cookie, flips the document
// direction immediately for snappy feedback, then refreshes so every Server
// Component re-renders in the new language.
export function LanguageToggle({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    // Persist for a year, site-wide.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Instant visual flip while the server re-render is in flight.
    const el = document.documentElement;
    el.lang = next;
    el.dir = dirForLocale(next);
    startTransition(() => router.refresh());
  }

  const next: Locale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => switchTo(next)}
      disabled={pending}
      aria-label={t.toggle.ariaLabel}
      className={`tq-btn tq-btn-ghost !px-3 !py-1.5 text-sm font-semibold ${className}`}
    >
      {t.toggle.switchTo}
    </button>
  );
}
