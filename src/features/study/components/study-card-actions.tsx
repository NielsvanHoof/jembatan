"use client";

import { StudyRatingRow } from "@/features/study/components/study-rating-row";
import type { StudyRating } from "@/features/study/lib/study-queue";
import type { StudyUiCopy } from "@/features/study/lib/study-ui-copy";

type StudyCardActionsProps = {
  dict: StudyUiCopy;
  isSentenceCard: boolean;
  wordsComplete: boolean;
  revealed: boolean;
  ratingPending: boolean;
  onReveal: () => void;
  onRate: (rating: StudyRating) => void;
};

/** Show-answer button or SM-2 rating row for the active card. */
export function StudyCardActions({
  dict,
  isSentenceCard,
  wordsComplete,
  revealed,
  ratingPending,
  onReveal,
  onRate,
}: StudyCardActionsProps) {
  if (isSentenceCard) {
    if (!wordsComplete) {
      return null;
    }
    return (
      <div className="study__actions">
        <StudyRatingRow dict={dict} disabled={ratingPending} onRate={onRate} />
      </div>
    );
  }

  if (!revealed) {
    return (
      <div className="study__actions">
        <button
          type="button"
          className="btn btn--primary btn--wide"
          onClick={onReveal}
        >
          {dict.showAnswer}
        </button>
      </div>
    );
  }

  return (
    <div className="study__actions">
      <StudyRatingRow dict={dict} disabled={ratingPending} onRate={onRate} />
    </div>
  );
}
