"use client";

import dynamic from "next/dynamic";
import type { StudyDirection } from "@/db/schema";
import { StudyCardActions } from "@/features/study/components/study-card-actions";
import { StudyEmpty } from "@/features/study/components/study-empty";
import { StudyFlashcard } from "@/features/study/components/study-flashcard";
import { StudyOfflineBanner } from "@/features/study/components/study-offline-banner";
import { StudyStageBar } from "@/features/study/components/study-stage-bar";
import { useStudySession } from "@/features/study/hooks/use-study-session";
import type {
  StudyDeckOption,
  StudyTagOption,
  StudyUiCopy,
} from "@/features/study/lib/study-ui-copy";
import type {
  CardStage,
  HabitSummary,
  StudyCard,
} from "@/features/study/types";
import type { Locale } from "@/lib/i18n/dictionaries";

import "../styles.css";

// Filters chrome stays out of the initial study chunk.
const StudyFilters = dynamic(
  () =>
    import("@/features/study/components/study-filters").then(
      (mod) => mod.StudyFilters,
    ),
  { ssr: false },
);

type StudySessionProps = {
  initialCards: StudyCard[];
  direction: StudyDirection;
  practiceAll: boolean;
  deckSlug: string;
  /** Localized deck chips — no full DeckSummary rows. */
  decks: StudyDeckOption[];
  /** Localized theme chips for the active deck only. */
  tagOptions: StudyTagOption[];
  /** Optional theme filter from `?tag=` */
  tag?: string;
  /** Outing level: words (1) or sentences (2). */
  stage?: CardStage;
  locale: Locale;
  dict: StudyUiCopy;
  habit: HabitSummary;
  /** True when cards came from IndexedDB (offline resume). */
  fromCache?: boolean;
};

/** One-card-at-a-time study loop with flip + SM-2 ratings. */
export function StudySession({
  initialCards,
  direction,
  practiceAll,
  deckSlug,
  decks,
  tagOptions,
  tag,
  stage,
  locale,
  dict,
  habit,
  fromCache = false,
}: StudySessionProps) {
  const session = useStudySession({
    initialCards,
    direction,
    practiceAll,
    deckSlug,
    tagOptions,
    tag,
    stage,
    locale,
    dict,
    habit,
    fromCache,
  });

  const { filters, offline, rating, current } = session;

  return (
    <div
      className={session.animateIn ? "study study--enter" : "study"}
      aria-busy={session.busy || undefined}
    >
      <StudyOfflineBanner
        syncNote={offline.syncNote}
        pendingSync={offline.pendingSync}
        syncPendingFallback={dict.syncPending}
      />

      <StudyStageBar
        dict={dict}
        filtersOpen={session.filtersOpen}
        onToggleFilters={() => session.setFiltersOpen((open) => !open)}
        themeLabel={session.themeLabel}
        stage={filters.stage}
        direction={filters.direction}
        hasCard={Boolean(current)}
        remaining={filters.queue.length}
      />

      {session.filtersOpen ? (
        <StudyFilters
          dict={dict}
          decks={decks}
          tagOptions={filters.tagOptions}
          deckSlug={filters.deckSlug}
          direction={filters.direction}
          tag={filters.tag}
          stage={filters.stage}
          habit={filters.habit}
          reviewedToday={filters.reviewedToday}
          disabled={session.filtersLocked || filters.filtersPending}
          onSwitch={filters.switchFilters}
        />
      ) : null}

      {/* Only the card stage dims while filters load — bar stays put. */}
      <div
        className={
          filters.filtersPending ? "study-board is-pending" : "study-board"
        }
      >
        {!current ? (
          <StudyEmpty
            dict={dict}
            locale={locale}
            deckSlug={filters.deckSlug}
            themeLabel={session.themeLabel}
            tag={filters.tag}
            nextDueText={session.nextDueText}
            practiceAll={filters.practiceAll}
            goalMet={session.goalMet}
            pending={filters.filtersPending}
            filtersLocked={session.filtersLocked}
            onPracticeAgain={() => filters.switchFilters({ practiceAll: true })}
            onClearTheme={() => filters.switchFilters({ tag: null })}
          />
        ) : (
          <>
            <StudyFlashcard
              card={current}
              direction={filters.direction}
              dict={dict}
              revealed={rating.revealed}
              isSentenceCard={session.isSentenceCard}
              onWordsCompleteChange={rating.setWordsComplete}
            />
            {rating.error ? (
              <p className="form-error" role="alert">
                {rating.error}
              </p>
            ) : null}
            <StudyCardActions
              dict={dict}
              isSentenceCard={session.isSentenceCard}
              wordsComplete={rating.wordsComplete}
              revealed={rating.revealed}
              ratingPending={rating.ratingPending}
              onReveal={() => rating.setRevealed(true)}
              onRate={rating.onRate}
            />
          </>
        )}
      </div>
    </div>
  );
}
