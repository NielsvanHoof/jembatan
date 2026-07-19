"use client";

import {
  RATING_KEYS,
  type StudyRating,
} from "@/features/study/lib/study-queue";
import type { StudyUiCopy } from "@/features/study/lib/study-ui-copy";

type StudyRatingRowProps = {
  dict: StudyUiCopy;
  disabled: boolean;
  onRate: (rating: StudyRating) => void;
};

/** Shared four-button SM-2 rating row (word cards + sentence cards). */
export function StudyRatingRow({
  dict,
  disabled,
  onRate,
}: StudyRatingRowProps) {
  return (
    <div className="rating-row">
      {RATING_KEYS.map((rating) => {
        const item = dict.ratings[rating];
        return (
          <button
            key={rating}
            type="button"
            className={`rating-btn rating-btn--${rating}`}
            disabled={disabled}
            onClick={() => onRate(rating)}
          >
            <span className="rating-btn__label">{item.label}</span>
            <span className="rating-btn__hint">{item.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
