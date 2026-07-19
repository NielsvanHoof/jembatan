"use client";

import type { StudyDirection } from "@/db/schema";
import { directionShort } from "@/features/study/lib/study-queue";
import type { StudyUiCopy } from "@/features/study/lib/study-ui-copy";
import type { CardStage } from "@/features/study/types";

type StudyStageBarProps = {
  dict: StudyUiCopy;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  themeLabel: string | null;
  stage?: CardStage;
  direction: StudyDirection;
  /** True when a card is on screen. */
  hasCard: boolean;
  remaining: number;
};

/** Slim stage bar — filters stay one tap away, even on the done screen. */
export function StudyStageBar({
  dict,
  filtersOpen,
  onToggleFilters,
  themeLabel,
  stage,
  direction,
  hasCard,
  remaining,
}: StudyStageBarProps) {
  return (
    <div className="study-stage">
      <button
        type="button"
        className={
          filtersOpen ? "study-stage__filters is-open" : "study-stage__filters"
        }
        aria-expanded={filtersOpen}
        onClick={onToggleFilters}
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
          {hasCard
            ? dict.cardsLeft.replace("{n}", String(remaining))
            : dict.done}
        </span>
      </p>
    </div>
  );
}
