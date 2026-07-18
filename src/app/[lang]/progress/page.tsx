import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getProgressStats } from "@/features/progress/actions";
import { listDecks, parseDeckSlug } from "@/features/study/lib/decks";
import type { DeckSummary } from "@/features/study/types";
import {
  type Dictionary,
  getDictionary,
  isLocale,
  type Locale,
} from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";
import { buildPageMetadata } from "@/lib/seo";

import "@/features/progress/styles.css";

type ProgressPageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ deck?: string }>;
};

/** Auth-gated — keep out of the index. */
export async function generateMetadata({
  params,
}: ProgressPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    return {};
  }
  const dict = getDictionary(lang);
  return buildPageMetadata({
    locale: lang,
    path: "/progress",
    title: dict.meta.pages.progress,
    description: dict.progress.lede,
    robots: { index: false, follow: false },
  });
}

function deckLabel(dict: Dictionary["study"], slug: string) {
  return dict.deckLabels[slug as keyof typeof dict.deckLabels] ?? slug;
}

function DeckPicker({
  locale,
  dict,
  decks,
  deckSlug,
}: {
  locale: Locale;
  dict: Dictionary;
  decks: DeckSummary[];
  deckSlug: string;
}) {
  if (decks.length <= 1) {
    return null;
  }

  return (
    <fieldset className="deck-toggle deck-toggle--page">
      <legend className="sr-only">{dict.progress.deckLegend}</legend>
      {decks.map((deck) => (
        <Link
          key={deck.slug}
          href={`${pathFor(locale, "/progress")}?deck=${deck.slug}`}
          className={
            deckSlug === deck.slug
              ? "deck-toggle__btn is-active"
              : "deck-toggle__btn"
          }
        >
          {deckLabel(dict.study, deck.slug)}
        </Link>
      ))}
    </fieldset>
  );
}

/**
 * Pride hero: streak when she’s building a habit; mastered when streak is still 0.
 */
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

export default async function ProgressPage({
  params,
  searchParams,
}: ProgressPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const query = await searchParams;
  const deckSlug = await parseDeckSlug(query.deck);
  const dict = getDictionary(lang);
  const [stats, decks] = await Promise.all([
    getProgressStats({ deckSlug }),
    listDecks(),
  ]);

  // Quiet secondary stats — hero already carries streak or mastered.
  const quietStats: { label: string; value: number }[] = [
    { label: dict.progress.dueNow, value: stats.dueNow },
    { label: dict.progress.reviewedToday, value: stats.reviewedToday },
    { label: dict.progress.dailyGoal, value: stats.dailyGoal },
    { label: dict.progress.learning, value: stats.learning },
  ];

  // Show the non-hero metric in the quiet list so nothing is hidden.
  if (stats.streakDays > 0) {
    quietStats.push({
      label: dict.progress.mastered,
      value: stats.mastered,
    });
  } else {
    quietStats.push({
      label: dict.progress.streak,
      value: stats.streakDays,
    });
  }

  quietStats.push({
    label: dict.progress.totalCards,
    value: stats.totalCards,
  });

  return (
    <div className="app-shell">
      <AppNav locale={lang} dict={dict} active="progress" />
      <main className="app-main progress-page">
        <h1>{dict.progress.title}</h1>
        <p className="lede">{dict.progress.lede}</p>

        <DeckPicker
          locale={lang}
          dict={dict}
          decks={decks}
          deckSlug={deckSlug}
        />

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
            href={`${pathFor(lang, "/study")}?deck=${deckSlug}`}
            className="btn btn--primary"
          >
            {dict.progress.startSession}
          </Link>
        </div>
      </main>
    </div>
  );
}
