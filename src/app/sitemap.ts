import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";
import { SITE_URL } from "@/lib/seo";

/** Public indexable paths only — study/progress/offline stay behind auth + noindex. */
const PUBLIC_PATHS = ["/", "/login", "/register"] as const;

/**
 * Locale-aware sitemap for crawlers.
 * Each entry includes hreflang alternates so Google can pair /id and /en.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PUBLIC_PATHS) {
    for (const locale of locales) {
      const languages = Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}${pathFor(l, path)}`]),
      );
      languages["x-default"] = `${SITE_URL}${pathFor("id", path)}`;

      entries.push({
        url: `${SITE_URL}${pathFor(locale, path)}`,
        lastModified: new Date(),
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.6,
        alternates: { languages },
      });
    }
  }

  return entries;
}
