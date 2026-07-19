"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { StudyDirection } from "@/db/schema";
import {
  loadStudySessionAction,
  reviewCardAction,
} from "@/features/study/actions";
import type {
  StudyDeckOption,
  StudyTagOption,
  StudyUiCopy,
} from "@/features/study/lib/study-ui-copy";
import { isOutingTag } from "@/features/study/lib/themes";
import type { CardStage, HabitSummary, StudyCard } from "@/features/study/types";
import { nextDueLabel } from "@/lib/habit";
import type { Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

import "../styles.css";

// Filters chrome + sentence builder stay out of the initial study chunk.
const StudyFilters = dynamic(
  () =>
    import("@/features/study/components/study-filters").then(
      (mod) => mod.StudyFilters,
    ),
  { ssr: false },
);

const SentenceBuilder = dynamic(
  () =>
    import("@/features/study/components/sentence-builder").then(
      (mod) => mod.SentenceBuilder,
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

const RATING_KEYS = ["again", "hard", "good", "easy"] as const;

function formatNextDue(dict: StudyUiCopy, nextDueAt: string | null) {
  const label = nextDueLabel(nextDueAt ? new Date(nextDueAt) : null);
  if (!label) {
    return null;
  }
  if (label.kind === "now" || (label.kind === "hours" && label.hours <= 1)) {
    return dict.emptyNextDue.replace("{when}", dict.nextDueSoon);
  }
  if (label.kind === "hours") {
    return dict.emptyNextDue.replace(
      "{when}",
      dict.nextDueHours.replace("{n}", String(label.hours)),
    );
  }
  return dict.emptyNextDue.replace(
    "{when}",
    dict.nextDueDays.replace("{n}", String(label.days)),
  );
}

/** Build study URL while preserving deck / direction / practice / theme / stage. */
function studyHref(
  locale: Locale,
  opts: {
    deckSlug: string;
    direction: StudyDirection;
    practiceAll?: boolean;
    tag?: string;
    stage?: CardStage;
  },
) {
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
function replaceStudyUrl(
  locale: Locale,
  opts: {
    deckSlug: string;
    direction: StudyDirection;
    practiceAll?: boolean;
    tag?: string;
    stage?: CardStage;
  },
) {
  window.history.replaceState(null, "", studyHref(locale, opts));
}

function applyLocalQueue(
  prev: StudyCard[],
  current: StudyCard,
  rating: (typeof RATING_KEYS)[number],
): StudyCard[] {
  const [, ...rest] = prev;
  if (rating === "again") {
    return [...rest, current];
  }
  return rest;
}

/** Compact ID ↔ NL label for the stage bar when filters are collapsed. */
function directionShort(direction: StudyDirection) {
  return direction === "id_to_nl" ? "ID → NL" : "NL → ID";
}

/** Signature bridge — shown on done / empty emotional peaks. */
function BridgeMark() {
  return (
    <div className="bridge-mark bridge-mark--compact" aria-hidden="true">
      <span>ID</span>
      <span className="bridge-mark__line" />
      <span>NL</span>
    </div>
  );
}

/** One-card-at-a-time study loop with flip + SM-2 ratings. */
export function StudySession({
  initialCards,
  direction: initialDirection,
  practiceAll: initialPracticeAll,
  deckSlug: initialDeckSlug,
  decks,
  tagOptions: initialTagOptions,
  tag: initialTag,
  stage: initialStage,
  locale,
  dict,
  habit: initialHabit,
  fromCache = false,
}: StudySessionProps) {
  const router = useRouter();
  const [queue, setQueue] = useState(initialCards);
  const [direction, setDirection] = useState(initialDirection);
  const [deckSlug, setDeckSlug] = useState(initialDeckSlug);
  const [tagOptions, setTagOptions] = useState(initialTagOptions);
  const [tag, setTag] = useState<string | undefined>(initialTag);
  const [stage, setStage] = useState<CardStage | undefined>(initialStage);
  const [practiceAll, setPracticeAll] = useState(initialPracticeAll);
  const [habit, setHabit] = useState(initialHabit);
  const [revealed, setRevealed] = useState(false);
  // Sentence cards: ratings unlock only after the builder succeeds.
  const [wordsComplete, setWordsComplete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Local count so the habit strip updates as she rates cards this session.
  const [reviewedToday, setReviewedToday] = useState(
    initialHabit.reviewedToday,
  );
  const [pendingSync, setPendingSync] = useState(0);
  const [syncNote, setSyncNote] = useState<string | null>(
    fromCache ? dict.syncPending : null,
  );
  const [offline, setOffline] = useState(false);
  // Play rise-in once on mount; filter switches must not re-animate.
  const [animateIn, setAnimateIn] = useState(true);
  // Card-forward: filters stay collapsed by default — including the done state.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const current = queue[0];
  const remaining = queue.length;
  const goalMet = reviewedToday >= habit.dailyGoal;
  const nextDueText = formatNextDue(dict, habit.nextDueAt);
  const themeLabel = tag
    ? (tagOptions.find((option) => option.tag === tag)?.label ?? tag)
    : null;
  // Sentence-stage cards use word-by-word reveal instead of a single flip.
  const isSentenceCard = current?.stage === "sentences";
  // Theme / direction / deck switches need the network (except cached resume).
  const filtersLocked = fromCache || offline;

  useEffect(() => {
    const id = window.setTimeout(() => setAnimateIn(false), 700);
    return () => window.clearTimeout(id);
  }, []);

  // Cache today’s queue for offline reopen — IDB helpers load in a separate chunk.
  useEffect(() => {
    void import("@/features/study/lib/offline-db").then(({ saveOfflineSession }) =>
      saveOfflineSession({
        deckSlug,
        direction,
        tag,
        stage,
        practiceAll,
        cards: queue,
        habit: { ...habit, reviewedToday },
      }),
    );
  }, [
    queue,
    deckSlug,
    direction,
    tag,
    stage,
    practiceAll,
    habit,
    reviewedToday,
  ]);

  useEffect(() => {
    // Read onLine only after mount — never in the initial render.
    setOffline(!navigator.onLine);

    void import("@/features/study/lib/offline-db").then(
      ({ countPendingReviews }) => countPendingReviews().then(setPendingSync),
    );

    function onOnline() {
      setOffline(false);
      void import("@/features/study/lib/offline-sync").then(
        ({ flushPendingReviews }) =>
          flushPendingReviews().then(({ remaining: left }) => {
            setPendingSync(left);
            if (left === 0) {
              setSyncNote(dict.syncDone);
            }
          }),
      );
    }
    function onOffline() {
      setOffline(true);
      setSyncNote(dict.syncPending);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [dict.syncDone, dict.syncPending]);

  /**
   * Soft-switch any study filter (deck / theme / stage / direction / practice).
   * Fetches via server action + replaceState — no RSC remount flash.
   */
  function switchFilters(next: {
    deckSlug?: string;
    direction?: StudyDirection;
    tag?: string | null;
    stage?: CardStage | null;
    practiceAll?: boolean;
  }) {
    if (filtersLocked || pending) {
      return;
    }

    const nextDeck = next.deckSlug ?? deckSlug;
    const nextDirection = next.direction ?? direction;
    const deckChanged = nextDeck !== deckSlug;
    // New deck drops theme; clearing theme uses null; otherwise keep.
    const nextTag = deckChanged
      ? undefined
      : next.tag === null
        ? undefined
        : (next.tag ?? tag);
    // Outing themes keep a level; clearing the theme drops it.
    // Switching outing theme (or deck) resets to Level 1 (words).
    let nextStage: CardStage | undefined;
    if (!isOutingTag(nextTag)) {
      nextStage = undefined;
    } else if (next.stage) {
      nextStage = next.stage;
    } else if (deckChanged || (next.tag !== undefined && next.tag !== tag)) {
      nextStage = "words";
    } else {
      nextStage = stage ?? "words";
    }
    const nextPracticeAll = next.practiceAll ?? practiceAll;

    if (
      nextDeck === deckSlug &&
      nextDirection === direction &&
      nextTag === tag &&
      nextStage === stage &&
      nextPracticeAll === practiceAll
    ) {
      return;
    }

    // Optimistic chip state so the bar feels instant (queue follows when ready).
    setDeckSlug(nextDeck);
    setDirection(nextDirection);
    setTag(nextTag);
    setStage(nextStage);
    setPracticeAll(nextPracticeAll);
    setRevealed(false);
    setWordsComplete(false);
    replaceStudyUrl(locale, {
      deckSlug: nextDeck,
      direction: nextDirection,
      practiceAll: nextPracticeAll,
      tag: nextTag,
      stage: nextStage,
    });

    startTransition(async () => {
      setError(null);
      try {
        const loaded = await loadStudySessionAction({
          direction: nextDirection,
          deckSlug: nextDeck,
          tag: nextTag,
          stage: nextStage,
          practiceAll: nextPracticeAll,
          locale,
        });

        setDeckSlug(loaded.deckSlug);
        setTagOptions(loaded.tagOptions);
        setTag(loaded.tag);
        setStage(loaded.stage);
        setQueue(loaded.cards);
        setHabit(loaded.habit);
        setReviewedToday(loaded.habit.reviewedToday);

        // Align URL if the server dropped an invalid theme for the new deck.
        if (
          loaded.tag !== nextTag ||
          loaded.stage !== nextStage ||
          loaded.deckSlug !== nextDeck
        ) {
          replaceStudyUrl(locale, {
            deckSlug: loaded.deckSlug,
            direction: nextDirection,
            practiceAll: nextPracticeAll,
            tag: loaded.tag,
            stage: loaded.stage,
          });
        }
      } catch {
        // Fall back to a normal navigation if the soft switch fails.
        router.push(
          studyHref(locale, {
            deckSlug: nextDeck,
            direction: nextDirection,
            practiceAll: nextPracticeAll,
            tag: nextTag,
            stage: nextStage,
          }),
        );
      }
    });
  }

  function onRate(rating: (typeof RATING_KEYS)[number]) {
    if (!current || pending) {
      return;
    }

    startTransition(async () => {
      setError(null);

      const advanceLocal = () => {
        // After a rating, collapse filters so the next card owns the screen.
        setFiltersOpen(false);
        setReviewedToday((n) => n + 1);
        setRevealed(false);
        setWordsComplete(false);
        setQueue((prev) => applyLocalQueue(prev, current, rating));
      };

      // Offline (or from cache without network): queue for later sync.
      if (!navigator.onLine) {
        const { enqueuePendingReview } = await import(
          "@/features/study/lib/offline-db"
        );
        await enqueuePendingReview({
          progressId: current.progressId,
          rating,
        });
        setPendingSync((n) => n + 1);
        setSyncNote(dict.syncPending);
        advanceLocal();
        return;
      }

      try {
        const result = await reviewCardAction({
          progressId: current.progressId,
          rating,
        });

        if (!result.ok) {
          setError(dict.errors[result.error]);
          return;
        }

        advanceLocal();
      } catch (caught) {
        const { isNetworkFailure } = await import(
          "@/features/study/lib/offline-sync"
        );
        if (!isNetworkFailure(caught)) {
          setError(dict.errors.card_not_found);
          return;
        }
        // Dropped mid-request — keep studying, sync later.
        const { enqueuePendingReview } = await import(
          "@/features/study/lib/offline-db"
        );
        await enqueuePendingReview({
          progressId: current.progressId,
          rating,
        });
        setPendingSync((n) => n + 1);
        setSyncNote(dict.syncPending);
        advanceLocal();
      }
    });
  }

  return (
    <div
      className={animateIn ? "study study--enter" : "study"}
      aria-busy={pending || undefined}
    >
      {syncNote || pendingSync > 0 ? (
        <p className="offline-banner" role="status">
          {syncNote ?? dict.syncPending}
          {pendingSync > 0 ? ` (${pendingSync})` : null}
        </p>
      ) : null}

      {/* Slim stage bar — filters stay one tap away, even on the done screen */}
      <div className="study-stage">
        <button
          type="button"
          className={
            filtersOpen
              ? "study-stage__filters is-open"
              : "study-stage__filters"
          }
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          {filtersOpen ? dict.hideFilters : dict.showFilters}
          {themeLabel && !filtersOpen ? (
            <span className="study-stage__tag">
              {themeLabel}
              {stage === "sentences"
                ? ` · ${dict.stageSentences}`
                : stage === "words"
                  ? ` · ${dict.stageWords}`
                  : null}
            </span>
          ) : null}
        </button>
        <p className="study-stage__meta">
          <span>{directionShort(direction)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {current
              ? dict.cardsLeft.replace("{n}", String(remaining))
              : dict.done}
          </span>
        </p>
      </div>

      {filtersOpen ? (
        <StudyFilters
          dict={dict}
          decks={decks}
          tagOptions={tagOptions}
          deckSlug={deckSlug}
          direction={direction}
          tag={tag}
          stage={stage}
          habit={habit}
          reviewedToday={reviewedToday}
          disabled={filtersLocked || pending}
          onSwitch={switchFilters}
        />
      ) : null}

      {/* Only the card stage dims while filters load — bar stays put. */}
      <div className={pending ? "study-board is-pending" : "study-board"}>
        {!current ? (
          <div className="study-empty">
            <BridgeMark />
            <h1>
              {themeLabel
                ? dict.emptyTitleTheme.replace("{theme}", themeLabel)
                : dict.emptyTitle}
            </h1>
            <p>{themeLabel ? dict.emptyBodyTheme : dict.emptyBody}</p>
            {nextDueText && !practiceAll ? (
              <p className="study-empty__next">{nextDueText}</p>
            ) : null}
            {goalMet ? (
              <p className="study-empty__goal">{dict.habitGoalMet}</p>
            ) : null}
            <div className="study-empty__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={pending || filtersLocked}
                onClick={() => switchFilters({ practiceAll: true })}
              >
                {dict.practiceAgain}
              </button>
              {tag ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={pending}
                  onClick={() => switchFilters({ tag: null })}
                >
                  {dict.clearTheme}
                </button>
              ) : (
                <Link
                  href={`${pathFor(locale, "/progress")}?deck=${deckSlug}`}
                  className="btn btn--ghost"
                >
                  {dict.seeProgress}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <article
              className={`flashcard${revealed || isSentenceCard ? " is-revealed" : ""}`}
              aria-live="polite"
            >
              <p className="flashcard__lang">
                {direction === "id_to_nl" ? dict.langId : dict.langNl}
              </p>
              <h1 className="flashcard__front">{current.front}</h1>

              {/* Sentence level: Duolingo-style build the daily line. */}
              {isSentenceCard ? (
                <div className="flashcard__back">
                  <p className="flashcard__lang">
                    {direction === "id_to_nl" ? dict.langNl : dict.langId}
                  </p>
                  <SentenceBuilder
                    key={current.cardId}
                    text={current.back}
                    onCompleteChange={setWordsComplete}
                    hintLabel={dict.builderHint}
                    tryAgainLabel={dict.builderTryAgain}
                    correctLabel={dict.builderCorrect}
                    wrongLabel={dict.builderWrong}
                    showAnswerLabel={dict.showAnswer}
                  />
                </div>
              ) : null}

              {revealed && !isSentenceCard ? (
                <div className="flashcard__back">
                  <p className="flashcard__lang">
                    {direction === "id_to_nl" ? dict.langNl : dict.langId}
                  </p>
                  <p className="flashcard__answer">{current.back}</p>
                  {current.exampleFront && current.exampleBack ? (
                    <p className="flashcard__example">
                      <span>{current.exampleFront}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{current.exampleBack}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="study__actions">
              {isSentenceCard ? (
                wordsComplete ? (
                  <div className="rating-row">
                    {RATING_KEYS.map((rating) => {
                      const item = dict.ratings[rating];
                      return (
                        <button
                          key={rating}
                          type="button"
                          className={`rating-btn rating-btn--${rating}`}
                          disabled={pending}
                          onClick={() => onRate(rating)}
                        >
                          <span className="rating-btn__label">
                            {item.label}
                          </span>
                          <span className="rating-btn__hint">{item.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null
              ) : !revealed ? (
                <button
                  type="button"
                  className="btn btn--primary btn--wide"
                  onClick={() => setRevealed(true)}
                >
                  {dict.showAnswer}
                </button>
              ) : (
                <div className="rating-row">
                  {RATING_KEYS.map((rating) => {
                    const item = dict.ratings[rating];
                    return (
                      <button
                        key={rating}
                        type="button"
                        className={`rating-btn rating-btn--${rating}`}
                        disabled={pending}
                        onClick={() => onRate(rating)}
                      >
                        <span className="rating-btn__label">{item.label}</span>
                        <span className="rating-btn__hint">{item.hint}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
