import type { Metadata } from "next";
import { DEFAULT_LOCALE, type Locale, locales } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

/**
 * Canonical site origin for absolute URLs (sitemap, OG, canonical).
 * Override with NEXT_PUBLIC_SITE_URL when the domain changes.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://jembatan-nu.vercel.app"
).replace(/\/$/, "");

/** Open Graph locale tags (underscore form). */
export function openGraphLocale(locale: Locale): string {
  return locale === "id" ? "id_ID" : "en_US";
}

/**
 * Canonical URL + hreflang alternates for a bare path (no locale prefix).
 * Example: localeAlternates("en", "/login") → canonical /en/login, id/en/x-default.
 */
export function localeAlternates(
  locale: Locale,
  path = "/",
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {
    "x-default": pathFor(DEFAULT_LOCALE, path),
  };
  for (const l of locales) {
    languages[l] = pathFor(l, path);
  }
  return {
    canonical: pathFor(locale, path),
    languages,
  };
}

type PageMetaInput = {
  locale: Locale;
  /** Path without locale, e.g. "/" or "/login". */
  path: string;
  title: string;
  description: string;
  /** Set index:false for auth-gated or utility routes. */
  robots?: Metadata["robots"];
};

/**
 * Shared page metadata: title, description, canonical/hreflang, OG + Twitter.
 * Layout still owns metadataBase, icons, and the default title template.
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  robots,
}: PageMetaInput): Metadata {
  const url = pathFor(locale, path);
  const alternateLocales = locales
    .filter((l) => l !== locale)
    .map(openGraphLocale);

  return {
    title,
    description,
    alternates: localeAlternates(locale, path),
    robots,
    openGraph: {
      title,
      description,
      url,
      locale: openGraphLocale(locale),
      alternateLocale: alternateLocales,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
