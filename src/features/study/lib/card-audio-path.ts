/**
 * Stable public paths for pre-generated Chirp 3 HD clips.
 * Script and study UI must use the same normalize + SHA-1 rules.
 */

export type AudioLocale = "id" | "nl";

/** Trim and collapse whitespace so YAML and on-screen text share one hash. */
export function normalizeAudioText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** Hex SHA-1 of normalized text (works in Node and the browser). */
export async function audioFileHash(text: string): Promise<string> {
  const normalized = normalizeAudioText(text);
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Browser / static URL for a clip, e.g. `/audio/nl/abc….mp3`. */
export async function audioPath(
  locale: AudioLocale,
  text: string,
): Promise<string> {
  const hash = await audioFileHash(text);
  return `/audio/${locale}/${hash}.mp3`;
}

/** Path under `public/` for the generate script (no leading slash). */
export async function audioPublicRelativePath(
  locale: AudioLocale,
  text: string,
): Promise<string> {
  const hash = await audioFileHash(text);
  return `audio/${locale}/${hash}.mp3`;
}

/** Prompt side language for the active study direction. */
export function promptAudioLocale(
  direction: "id_to_nl" | "nl_to_id",
): AudioLocale {
  return direction === "id_to_nl" ? "id" : "nl";
}

/** Answer side language for the active study direction. */
export function answerAudioLocale(
  direction: "id_to_nl" | "nl_to_id",
): AudioLocale {
  return direction === "id_to_nl" ? "nl" : "id";
}
