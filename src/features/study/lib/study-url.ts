/**
 * Study route URL helpers.
 * Pure string building plus a thin replaceState wrapper for soft filter switches.
 */

import type { StudyDirection } from "@/db/schema";
import type { CardStage } from "@/features/study/types";
import type { Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

/** Shared filter dims used when building or syncing the study query string. */
export type StudyUrlOpts = {
  deckSlug: string;
  direction: StudyDirection;
  practiceAll?: boolean;
  tag?: string;
  stage?: CardStage;
};

/** Build study URL while preserving deck / direction / practice / theme / stage. */
export function studyHref(locale: Locale, opts: StudyUrlOpts) {
  const params = new URLSearchParams();
  params.set("deck", opts.deckSlug);
  params.set("direction", opts.direction);
  if (opts.practiceAll) {
    params.set("practice", "1");
  }
  if (opts.tag) {
    params.set("tag", opts.tag);
  }
  // Only outing themes carry a level in the URL.
  if (opts.tag && opts.stage) {
    params.set("stage", opts.stage);
  }
  return `${pathFor(locale, "/study")}?${params.toString()}`;
}

/** Sync query string without a Next.js navigation (no RSC flash). */
export function replaceStudyUrl(locale: Locale, opts: StudyUrlOpts) {
  window.history.replaceState(null, "", studyHref(locale, opts));
}
