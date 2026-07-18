"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { StudyDirection } from "@/db/schema";
import {
  getDueCards,
  getHabitSummary,
  reviewCardAction,
} from "@/features/study/actions";
import type { DeckSummary } from "@/features/study/lib/decks";
import {
  countPendingReviews,
  enqueuePendingReview,
  saveOfflineSession,
} from "@/features/study/lib/offline-db";
import {
  flushPendingReviews,
  isNetworkFailure,
} from "@/features/study/lib/offline-sync";
import { partitionDeckTags } from "@/features/study/lib/themes";
import type { HabitSummary, StudyCard } from "@/features/study/types";
import { nextDueLabel } from "@/lib/habit";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

import "../styles.css";

type StudySessionProps = {
  initialCards: StudyCard[];
  direction: StudyDirection;
  practiceAll: boolean;
  deckSlug: string;
  decks: DeckSummary[];
  /** Tags that exist on cards in this deck */
  deckTags: string[];
  /** Optional theme filter from `?tag=` */
  tag?: string;
  locale: Locale;
  dict: Dictionary["study"];
  habit: HabitSummary;
  /** True when cards came from IndexedDB (offline resume). */
  fromCache?: boolean;
};

const RATING_KEYS = ["again", "hard", "good", "easy"] as const;

function formatNextDue(dict: Dictionary["study"], nextDueAt: string | null) {
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

function tagLabel(dict: Dictionary["study"], tag: string) {
  return dict.tags[tag as keyof typeof dict.tags] ?? tag;
}

function deckLabel(dict: Dictionary["study"], slug: string) {
  return dict.deckLabels[slug as keyof typeof dict.deckLabels] ?? slug;
}

/** Build study URL while preserving deck / direction / practice / theme. */
function studyHref(
  locale: Locale,
  opts: {
    deckSlug: string;
    direction: StudyDirection;
    practiceAll?: boolean;
    tag?: string;
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

/** One-card-at-a-time study loop with flip + SM-2 ratings. */
export function StudySession({
  initialCards,
  direction: initialDirection,
  practiceAll: initialPracticeAll,
  deckSlug,
  decks,
  deckTags,
  tag: initialTag,
  locale,
  dict,
  habit: initialHabit,
  fromCache = false,
}: StudySessionProps) {
  const router = useRouter();
  const [queue, setQueue] = useState(initialCards);
  const [direction, setDirection] = useState(initialDirection);
  const [tag, setTag] = useState<string | undefined>(initialTag);
  const [practiceAll, setPracticeAll] = useState(initialPracticeAll);
  const [habit, setHabit] = useState(initialHabit);
  const [revealed, setRevealed] = useState(false);
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

  const current = queue[0];
  const remaining = queue.length;
  const goalMet = reviewedToday >= habit.dailyGoal;
  const nextDueText = formatNextDue(dict, habit.nextDueAt);
  const themeLabel = tag ? tagLabel(dict, tag) : null;
  const { outing, other } = partitionDeckTags(deckTags);
  // Theme / direction / deck switches need the network (except cached resume).
  const filtersLocked = fromCache || offline;

  useEffect(() => {
    const id = window.setTimeout(() => setAnimateIn(false), 700);
    return () => window.clearTimeout(id);
  }, []);

  // Cache today’s queue for offline reopen + keep IDB in sync as she studies.
  useEffect(() => {
    void saveOfflineSession({
      deckSlug,
      direction,
      tag,
      practiceAll,
      cards: queue,
      habit: { ...habit, reviewedToday },
    });
  }, [queue, deckSlug, direction, tag, practiceAll, habit, reviewedToday]);

  useEffect(() => {
    // Read onLine only after mount — never in the initial render.
    setOffline(!navigator.onLine);
    void countPendingReviews().then(setPendingSync);

    function onOnline() {
      setOffline(false);
      void flushPendingReviews().then(({ remaining: left }) => {
        setPendingSync(left);
        if (left === 0) {
          setSyncNote(dict.syncDone);
        }
      });
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

  /** Deck change still does a full navigation (new tags + content). */
  function switchDeck(nextDeck: string) {
    if (filtersLocked || nextDeck === deckSlug) {
      return;
    }
    router.push(
      studyHref(locale, {
        deckSlug: nextDeck,
        direction,
        practiceAll,
      }),
    );
  }

  /**
   * Theme / direction / practice-all: fetch on the client and replaceState.
   * Avoids RSC remount flash from router.push.
   */
  function switchFilters(next: {
    direction?: StudyDirection;
    tag?: string | null;
    practiceAll?: boolean;
  }) {
    if (filtersLocked || pending) {
      return;
    }

    const nextDirection = next.direction ?? direction;
    const nextTag = next.tag === null ? undefined : (next.tag ?? tag);
    const nextPracticeAll = next.practiceAll ?? practiceAll;

    if (
      nextDirection === direction &&
      nextTag === tag &&
      nextPracticeAll === practiceAll
    ) {
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const [cards, nextHabit] = await Promise.all([
          getDueCards(nextDirection, {
            practiceAll: nextPracticeAll,
            tag: nextTag,
            deckSlug,
          }),
          getHabitSummary(nextDirection, {
            tag: nextTag,
            deckSlug,
          }),
        ]);

        setDirection(nextDirection);
        setTag(nextTag);
        setPracticeAll(nextPracticeAll);
        setQueue(cards);
        setHabit(nextHabit);
        setReviewedToday(nextHabit.reviewedToday);
        setRevealed(false);

        replaceStudyUrl(locale, {
          deckSlug,
          direction: nextDirection,
          practiceAll: nextPracticeAll,
          tag: nextTag,
        });
      } catch {
        // Fall back to a normal navigation if the soft switch fails.
        router.push(
          studyHref(locale, {
            deckSlug,
            direction: nextDirection,
            practiceAll: nextPracticeAll,
            tag: nextTag,
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
        setReviewedToday((n) => n + 1);
        setRevealed(false);
        setQueue((prev) => applyLocalQueue(prev, current, rating));
      };

      // Offline (or from cache without network): queue for later sync.
      if (!navigator.onLine) {
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
        if (!isNetworkFailure(caught)) {
          setError(dict.errors.card_not_found);
          return;
        }
        // Dropped mid-request — keep studying, sync later.
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
    <div className={animateIn ? "study study--enter" : "study"}>
      {syncNote || pendingSync > 0 ? (
        <p className="offline-banner" role="status">
          {syncNote ?? dict.syncPending}
          {pendingSync > 0 ? ` (${pendingSync})` : null}
        </p>
      ) : null}

      <div className="habit-strip" aria-live="polite">
        <span>{dict.habitDue.replace("{n}", String(habit.dueNow))}</span>
        <span aria-hidden="true">·</span>
        <span>
          {dict.habitToday
            .replace("{done}", String(reviewedToday))
            .replace("{goal}", String(habit.dailyGoal))}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {habit.streakDays > 0
            ? dict.habitStreak.replace("{n}", String(habit.streakDays))
            : goalMet
              ? dict.habitGoalMet
              : dict.habitStreak.replace("{n}", "0")}
        </span>
      </div>

      {/* Deck picker */}
      {decks.length > 1 ? (
        <fieldset className="deck-toggle" disabled={filtersLocked || pending}>
          <legend className="sr-only">{dict.deckLegend}</legend>
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
              {deckLabel(dict, deck.slug)}
            </button>
          ))}
        </fieldset>
      ) : null}

      {/* Theme filter: outing shortcuts first (if in deck), then the rest */}
      {deckTags.length > 0 ? (
        <div className="theme-bar">
          {outing.length > 0 ? (
            <p className="theme-bar__outing">{dict.outingLabel}</p>
          ) : null}
          <fieldset className="theme-chips" disabled={filtersLocked || pending}>
            <legend className="sr-only">{dict.themeLegend}</legend>
            <button
              type="button"
              className={
                !tag ? "theme-chips__btn is-active" : "theme-chips__btn"
              }
              onClick={() => switchFilters({ tag: null })}
            >
              {dict.themeAll}
            </button>
            {outing.map((outingTag) => (
              <button
                key={outingTag}
                type="button"
                className={
                  tag === outingTag
                    ? "theme-chips__btn theme-chips__btn--outing is-active"
                    : "theme-chips__btn theme-chips__btn--outing"
                }
                onClick={() => switchFilters({ tag: outingTag })}
              >
                {tagLabel(dict, outingTag)}
              </button>
            ))}
            {other.map((otherTag) => (
              <button
                key={otherTag}
                type="button"
                className={
                  tag === otherTag
                    ? "theme-chips__btn is-active"
                    : "theme-chips__btn"
                }
                onClick={() => switchFilters({ tag: otherTag })}
              >
                {tagLabel(dict, otherTag)}
              </button>
            ))}
          </fieldset>
        </div>
      ) : null}

      <div className="study__toolbar">
        <fieldset
          className="direction-toggle"
          disabled={filtersLocked || pending}
        >
          <legend className="sr-only">{dict.directionLegend}</legend>
          <button
            type="button"
            className={
              direction === "id_to_nl"
                ? "direction-toggle__btn is-active"
                : "direction-toggle__btn"
            }
            onClick={() => switchFilters({ direction: "id_to_nl" })}
          >
            ID → NL
          </button>
          <button
            type="button"
            className={
              direction === "nl_to_id"
                ? "direction-toggle__btn is-active"
                : "direction-toggle__btn"
            }
            onClick={() => switchFilters({ direction: "nl_to_id" })}
          >
            NL → ID
          </button>
        </fieldset>
        <p className="study__count">
          {remaining > 0
            ? dict.cardsLeft.replace("{n}", String(remaining))
            : dict.done}
        </p>
      </div>

      {!current ? (
        <div className="study-empty">
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
            className={`flashcard${revealed ? " is-revealed" : ""}`}
            aria-live="polite"
          >
            <p className="flashcard__lang">
              {direction === "id_to_nl" ? dict.langId : dict.langNl}
            </p>
            <h1 className="flashcard__front">{current.front}</h1>

            {revealed ? (
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
            {!revealed ? (
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
  );
}
