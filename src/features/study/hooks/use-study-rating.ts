"use client";

import {
  type Dispatch,
  type SetStateAction,
  useState,
  useTransition,
} from "react";
import { reviewCardAction } from "@/features/study/actions/review";
import {
  applyLocalQueue,
  type StudyRating,
} from "@/features/study/lib/study-queue";
import type { StudyUiCopy } from "@/features/study/lib/study-ui-copy";
import type { StudyCard } from "@/features/study/types";

type UseStudyRatingArgs = {
  current: StudyCard | undefined;
  dict: StudyUiCopy;
  setQueue: Dispatch<SetStateAction<StudyCard[]>>;
  setReviewedToday: Dispatch<SetStateAction<number>>;
  setFiltersOpen: Dispatch<SetStateAction<boolean>>;
  setPendingSync: Dispatch<SetStateAction<number>>;
  setSyncNote: Dispatch<SetStateAction<string | null>>;
};

/**
 * Card reveal / sentence-complete state and SM-2 rating (online + offline enqueue).
 * Owns a separate useTransition from filter soft-switches.
 */
export function useStudyRating({
  current,
  dict,
  setQueue,
  setReviewedToday,
  setFiltersOpen,
  setPendingSync,
  setSyncNote,
}: UseStudyRatingArgs) {
  const [revealed, setRevealed] = useState(false);
  // Sentence cards: ratings unlock only after the builder succeeds.
  const [wordsComplete, setWordsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingPending, startRatingTransition] = useTransition();

  /** Clear flip / builder / error when filters change. */
  function resetCardUi() {
    setRevealed(false);
    setWordsComplete(false);
    setError(null);
  }

  function onRate(rating: StudyRating) {
    if (!current || ratingPending) {
      return;
    }

    startRatingTransition(async () => {
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

  return {
    revealed,
    setRevealed,
    wordsComplete,
    setWordsComplete,
    error,
    ratingPending,
    resetCardUi,
    onRate,
  };
}
