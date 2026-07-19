"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getProgressStats } from "@/features/progress/actions";
import type { ProgressStats } from "@/features/progress/types";
import type { DeckSummary } from "@/features/study/types";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

import "../styles.css";

type ProgressPanelProps = {
  locale: Locale;
  dict: Dictionary;
  decks: DeckSummary[];
  initialDeckSlug: string;
  initialStats: ProgressStats;
};

function deckLabel(dict: Dictionary["study"], slug: string) {
  return dict.deckLabels[slug as keyof typeof dict.deckLabels] ?? slug;
}

/** Pride hero: streak when habit is alive; mastered when streak is still 0. */
function ProgressHero({
  streakDays,
  mastered,
  streakCaption,
  masteredCaption,
}: {
  streakDays: number;
  mastered: number;
  streakCaption: string;
  masteredCaption: string;
}) {
  const useStreak = streakDays > 0;
  const value = useStreak ? streakDays : mastered;
  const caption = useStreak ? streakCaption : masteredCaption;

  return (
    <div className="progress-hero">
      <p className="progress-hero__value">{value}</p>
      <p className="progress-hero__caption">{caption}</p>
    </div>
  );
}

function buildQuietStats(
  dict: Dictionary["progress"],
  stats: ProgressStats,
): { label: string; value: number }[] {
  const quietStats: { label: string; value: number }[] = [
    { label: dict.dueNow, value: stats.dueNow },
    { label: dict.reviewedToday, value: stats.reviewedToday },
    { label: dict.dailyGoal, value: stats.dailyGoal },
    { label: dict.learning, value: stats.learning },
  ];

  if (stats.streakDays > 0) {
    quietStats.push({ label: dict.mastered, value: stats.mastered });
  } else {
    quietStats.push({ label: dict.streak, value: stats.streakDays });
  }

  quietStats.push({ label: dict.totalCards, value: stats.totalCards });
  return quietStats;
}

/** Sync `?deck=` without a Next.js navigation (no RSC flash). */
function replaceProgressUrl(locale: Locale, deckSlug: string) {
  const href = `${pathFor(locale, "/progress")}?deck=${deckSlug}`;
  window.history.replaceState(null, "", href);
}

/**
 * Progress body with soft-switch deck filter.
 * Same pattern as Study: server action + replaceState + useTransition.
 */
export function ProgressPanel({
  locale,
  dict,
  decks,
  initialDeckSlug,
  initialStats,
}: ProgressPanelProps) {
  const router = useRouter();
  const [deckSlug, setDeckSlug] = useState(initialDeckSlug);
  const [stats, setStats] = useState(initialStats);
  const [pending, startTransition] = useTransition();

  function switchDeck(nextDeck: string) {
    if (pending || nextDeck === deckSlug) {
      return;
    }

    startTransition(async () => {
      try {
        const nextStats = await getProgressStats({ deckSlug: nextDeck });
        setDeckSlug(nextDeck);
        setStats(nextStats);
        replaceProgressUrl(locale, nextDeck);
      } catch {
        router.push(`${pathFor(locale, "/progress")}?deck=${nextDeck}`);
      }
    });
  }

  const quietStats = buildQuietStats(dict.progress, stats);

  return (
    <div
      className={pending ? "progress-panel is-pending" : "progress-panel"}
      aria-busy={pending || undefined}
    >
      <h1>{dict.progress.title}</h1>
      <p className="lede">{dict.progress.lede}</p>

      {decks.length > 1 ? (
        <fieldset className="deck-toggle deck-toggle--page" disabled={pending}>
          <legend className="sr-only">{dict.progress.deckLegend}</legend>
          {decks.map((deck) => (
            <button
              key={deck.slug}
              type="button"
              className={
                deckSlug === deck.slug
                  ? "deck-toggle__btn is-active"
                  : "deck-toggle__btn"
              }
              onClick={() => switchDeck(deck.slug)}
            >
              {deckLabel(dict.study, deck.slug)}
            </button>
          ))}
        </fieldset>
      ) : null}

      <ProgressHero
        streakDays={stats.streakDays}
        mastered={stats.mastered}
        streakCaption={dict.progress.streakHero}
        masteredCaption={dict.progress.masteredHero}
      />

      <ul className="stat-list stat-list--quiet">
        {quietStats.map((item) => (
          <li key={item.label}>
            <span className="stat-list__label">{item.label}</span>
            <span className="stat-list__value">{item.value}</span>
          </li>
        ))}
      </ul>

      <div className="progress-cta">
        <Link
          href={`${pathFor(locale, "/study")}?deck=${deckSlug}`}
          className="btn btn--primary"
          prefetch
        >
          {dict.progress.startSession}
        </Link>
      </div>
    </div>
  );
}
