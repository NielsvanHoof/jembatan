"use client";

import { useRouter } from "next/navigation";
import {
  type MutableRefObject,
  type RefObject,
  useState,
  useTransition,
} from "react";
import type { StudyDirection } from "@/db/schema";
import { loadStudySessionAction } from "@/features/study/actions/session";
import {
  resolveStudyFilters,
  type StudyFilterPatch,
} from "@/features/study/lib/resolve-study-filters";
import type { StudyTagOption } from "@/features/study/lib/study-ui-copy";
import { replaceStudyUrl, studyHref } from "@/features/study/lib/study-url";
import type {
  CardStage,
  HabitSummary,
  StudyCard,
} from "@/features/study/types";
import type { Locale } from "@/lib/i18n/dictionaries";

type UseStudyFiltersArgs = {
  initialCards: StudyCard[];
  initialDirection: StudyDirection;
  initialPracticeAll: boolean;
  initialDeckSlug: string;
  initialTagOptions: StudyTagOption[];
  initialTag?: string;
  initialStage?: CardStage;
  initialHabit: HabitSummary;
  locale: Locale;
  /**
   * Live lock from offline / fromCache (updated by StudySession after
   * useStudyOffline). Read only inside switchFilters.
   */
  filtersLockedRef: RefObject<boolean>;
  /** Clear reveal / builder / error after an actual filter change. */
  onCardResetRef: MutableRefObject<() => void>;
};

/**
 * Filter dims + soft-switch via server action + replaceState.
 * Owns its own useTransition so rating pending does not lock chips.
 */
export function useStudyFilters({
  initialCards,
  initialDirection,
  initialPracticeAll,
  initialDeckSlug,
  initialTagOptions,
  initialTag,
  initialStage,
  initialHabit,
  locale,
  filtersLockedRef,
  onCardResetRef,
}: UseStudyFiltersArgs) {
  const router = useRouter();
  const [queue, setQueue] = useState(initialCards);
  const [direction, setDirection] = useState(initialDirection);
  const [deckSlug, setDeckSlug] = useState(initialDeckSlug);
  const [tagOptions, setTagOptions] = useState(initialTagOptions);
  const [tag, setTag] = useState<string | undefined>(initialTag);
  const [stage, setStage] = useState<CardStage | undefined>(initialStage);
  const [practiceAll, setPracticeAll] = useState(initialPracticeAll);
  const [habit, setHabit] = useState(initialHabit);
  // Local count so the habit strip updates as she rates cards this session.
  const [reviewedToday, setReviewedToday] = useState(
    initialHabit.reviewedToday,
  );
  const [filtersPending, startFilterTransition] = useTransition();

  /**
   * Soft-switch any study filter (deck / theme / stage / direction / practice).
   * Fetches via server action + replaceState — no RSC remount flash.
   */
  function switchFilters(next: StudyFilterPatch) {
    if (filtersLockedRef.current || filtersPending) {
      return;
    }

    const resolved = resolveStudyFilters(
      { deckSlug, direction, tag, stage, practiceAll },
      next,
    );
    if (resolved.unchanged) {
      return;
    }

    const {
      deckSlug: nextDeck,
      direction: nextDirection,
      tag: nextTag,
      stage: nextStage,
      practiceAll: nextPracticeAll,
    } = resolved;

    // Optimistic chip state so the bar feels instant (queue follows when ready).
    setDeckSlug(nextDeck);
    setDirection(nextDirection);
    setTag(nextTag);
    setStage(nextStage);
    setPracticeAll(nextPracticeAll);
    onCardResetRef.current();
    replaceStudyUrl(locale, {
      deckSlug: nextDeck,
      direction: nextDirection,
      practiceAll: nextPracticeAll,
      tag: nextTag,
      stage: nextStage,
    });

    startFilterTransition(async () => {
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

  return {
    queue,
    setQueue,
    direction,
    deckSlug,
    tagOptions,
    tag,
    stage,
    practiceAll,
    habit,
    reviewedToday,
    setReviewedToday,
    filtersPending,
    switchFilters,
  };
}
