import { isLocale } from "@/lib/i18n/dictionaries";
import { createOgImage, ogContentType, ogSize } from "@/lib/og-image";

export const alt = "Jembatan — Indonesian ↔ Dutch";
export const size = ogSize;
export const contentType = ogContentType;

type OgImageProps = {
  params: Promise<{ lang: string }>;
};

/**
 * Locale-aware Open Graph card (1200×630) with the bridge motif.
 * Next wires this into og:image for /id and /en automatically.
 */
export default async function Image({ params }: OgImageProps) {
  const { lang } = await params;
  return createOgImage(isLocale(lang) ? lang : "id");
}
