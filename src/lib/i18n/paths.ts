import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
  locales,
} from "@/lib/i18n/dictionaries";

/** Build a localized app path, e.g. pathFor("en", "/belajar") → "/en/belajar". */
export function pathFor(locale: Locale, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

/** Pull `/id` or `/en` off a pathname. */
export function getLocaleFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : null;
}

/** Strip the locale prefix for auth matching (/en/belajar → /belajar). */
export function stripLocalePrefix(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) {
    return pathname;
  }
  const rest = pathname.slice(locale.length + 1) || "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/**
 * Pick a locale from Accept-Language (simple match).
 * Default stays Indonesian for the primary learner.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  const lowered = acceptLanguage.toLowerCase();
  // Prefer an explicit Indonesian tag when present.
  if (lowered.includes("id")) {
    return "id";
  }
  if (lowered.includes("en")) {
    return "en";
  }

  return DEFAULT_LOCALE;
}

export function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}
