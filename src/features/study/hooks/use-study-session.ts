"use client";

import { useEffect, useRef, useState } from "react";
import type { StudyDirection } from "@/db/schema";
import { useStudyFilters } from "@/features/study/hooks/use-study-filters";
import { useStudyOffline } from "@/features/study/hooks/use-study-offline";
import { useStudyRating } from "@/features/study/hooks/use-study-rating";
import { formatNextDue } from "@/features/study/lib/study-queue";
import type {
  StudyTagOption,
  StudyUiCopy,
} from "@/features/study/lib/study-ui-copy";
import type {
  CardStage,
  HabitSummary,
  StudyCard,
} from "@/features/study/types";
import type { Locale } from "@/lib/i18n/dictionaries";

type UseStudySessionArgs = {
  initialCards: StudyCard[];
  direction: StudyDirection;
  practiceAll: boolean;
  deckSlug: string;
  tagOptions: StudyTagOption[];
  tag?: string;
  stage?: CardStage;
  locale: Locale;
  dict: StudyUiCopy;
  habit: HabitSummary;
  fromCache: boolean;
};

/**
 * Compose offline / filters / rating hooks for the study shell.
 * Keeps StudySession focused on layout.
 */
export function useStudySession({
  initialCards,
  direction: initialDirection,
  practiceAll: initialPracticeAll,
  deckSlug: initialDeckSlug,
  tagOptions: initialTagOptions,
  tag: initialTag,
  stage: initialStage,
  locale,
  dict,
  habit: initialHabit,
  fromCache,
}: UseStudySessionArgs) {
  // Play rise-in once on mount; filter switches must not re-animate.
  const [animateIn, setAnimateIn] = useState(true);
  // Card-forward: filters stay collapsed by default — including the done state.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Refs break the filters ↔ rating / offline hook cycle without reordering hooks.
  const filtersLockedRef = useRef(fromCache);
  const resetCardUiRef = useRef(() => {});

  const filters = useStudyFilters({
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
    onCardResetRef: resetCardUiRef,
  });

  const offline = useStudyOffline({
    fromCache,
    syncPendingCopy: dict.syncPending,
    syncDoneCopy: dict.syncDone,
    session: {
      deckSlug: filters.deckSlug,
      direction: filters.direction,
      tag: filters.tag,
      stage: filters.stage,
      practiceAll: filters.practiceAll,
      cards: filters.queue,
      habit: filters.habit,
      reviewedToday: filters.reviewedToday,
    },
  });

  // Keep soft-switch lock in sync with live offline / fromCache state.
  filtersLockedRef.current = offline.filtersLocked;

  const current = filters.queue[0];
  const rating = useStudyRating({
    current,
    dict,
    setQueue: filters.setQueue,
    setReviewedToday: filters.setReviewedToday,
    setFiltersOpen,
    setPendingSync: offline.setPendingSync,
    setSyncNote: offline.setSyncNote,
  });

  resetCardUiRef.current = rating.resetCardUi;

  const themeLabel = filters.tag
    ? (filters.tagOptions.find((option) => option.tag === filters.tag)?.label ??
      filters.tag)
    : null;

  useEffect(() => {
    const id = window.setTimeout(() => setAnimateIn(false), 700);
    return () => window.clearTimeout(id);
  }, []);

  return {
    animateIn,
    filtersOpen,
    setFiltersOpen,
    filters,
    offline,
    rating,
    current,
    themeLabel,
    // Sentence-stage cards use word-by-word reveal instead of a single flip.
    isSentenceCard: current?.stage === "sentences",
    busy: filters.filtersPending || rating.ratingPending,
    filtersLocked: offline.filtersLocked,
    nextDueText: formatNextDue(dict, filters.habit.nextDueAt),
    goalMet: filters.reviewedToday >= filters.habit.dailyGoal,
  };
}
