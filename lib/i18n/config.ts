// Locale primitives shared by the server cookie reader and the client provider.
// We keep this tiny and dependency-free so it can be imported anywhere.

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// The cookie that remembers the visitor's language across requests/sessions.
export const LOCALE_COOKIE = "taqa_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ar";
}

// Text direction: Arabic reads right-to-left.
export function dirForLocale(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
