import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getProgressStats } from "@/features/progress/actions";
import {
  type DeckSummary,
  listDecks,
  parseDeckSlug,
} from "@/features/study/lib/decks";
import {
  type Dictionary,
  getDictionary,
  isLocale,
  type Locale,
} from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

import "@/features/progress/styles.css";

type ProgressPageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ deck?: string }>;
};

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

        <div className="habit-strip habit-strip--page" aria-live="polite">
          <span>
            {dict.study.habitToday
              .replace("{done}", String(stats.reviewedToday))
              .replace("{goal}", String(stats.dailyGoal))}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {dict.study.habitStreak.replace("{n}", String(stats.streakDays))}
          </span>
        </div>

        <ul className="stat-list">
          <li>
            <span className="stat-list__label">{dict.progress.dueNow}</span>
            <span className="stat-list__value">{stats.dueNow}</span>
          </li>
          <li>
            <span className="stat-list__label">
              {dict.progress.reviewedToday}
            </span>
            <span className="stat-list__value">{stats.reviewedToday}</span>
          </li>
          <li>
            <span className="stat-list__label">{dict.progress.streak}</span>
            <span className="stat-list__value">{stats.streakDays}</span>
          </li>
          <li>
            <span className="stat-list__label">{dict.progress.dailyGoal}</span>
            <span className="stat-list__value">{stats.dailyGoal}</span>
          </li>
          <li>
            <span className="stat-list__label">{dict.progress.learning}</span>
            <span className="stat-list__value">{stats.learning}</span>
          </li>
          <li>
            <span className="stat-list__label">{dict.progress.mastered}</span>
            <span className="stat-list__value">{stats.mastered}</span>
          </li>
          <li>
            <span className="stat-list__label">{dict.progress.totalCards}</span>
            <span className="stat-list__value">{stats.totalCards}</span>
          </li>
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
