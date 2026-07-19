"use client";

import type { StudyDirection } from "@/db/schema";
import type {
  StudyDeckOption,
  StudyTagOption,
  StudyUiCopy,
} from "@/features/study/lib/study-ui-copy";
import { isOutingTag, partitionDeckTags } from "@/features/study/lib/themes";
import type { CardStage, HabitSummary } from "@/features/study/types";

type StudyFiltersProps = {
  dict: StudyUiCopy;
  decks: StudyDeckOption[];
  tagOptions: StudyTagOption[];
  deckSlug: string;
  direction: StudyDirection;
  tag?: string;
  stage?: CardStage;
  habit: HabitSummary;
  reviewedToday: number;
  disabled: boolean;
  onSwitch: (next: {
    deckSlug?: string;
    direction?: StudyDirection;
    tag?: string | null;
    stage?: CardStage | null;
    practiceAll?: boolean;
  }) => void;
};

/**
 * Collapsible study chrome — deck / theme / stage / direction.
 * Lazy-loaded when the filters panel opens (keeps the card stage lean).
 */
export function StudyFilters({
  dict,
  decks,
  tagOptions,
  deckSlug,
  direction,
  tag,
  stage,
  habit,
  reviewedToday,
  disabled,
  onSwitch,
}: StudyFiltersProps) {
  const goalMet = reviewedToday >= habit.dailyGoal;
  const deckTags = tagOptions.map((option) => option.tag);
  const labelByTag = new Map(
    tagOptions.map((option) => [option.tag, option.label]),
  );
  const { outing, other } = partitionDeckTags(deckTags);
  const showStageFilter = isOutingTag(tag);

  return (
    <div className="study-filters">
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

      {decks.length > 1 ? (
        <fieldset className="deck-toggle" disabled={disabled}>
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
              onClick={() => onSwitch({ deckSlug: deck.slug })}
            >
              {deck.label}
            </button>
          ))}
        </fieldset>
      ) : null}

      {tagOptions.length > 0 ? (
        <div className="theme-bar">
          {outing.length > 0 ? (
            <p className="theme-bar__outing">{dict.outingLabel}</p>
          ) : null}
          <fieldset className="theme-chips" disabled={disabled}>
            <legend className="sr-only">{dict.themeLegend}</legend>
            <button
              type="button"
              className={
                !tag ? "theme-chips__btn is-active" : "theme-chips__btn"
              }
              onClick={() => onSwitch({ tag: null })}
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
                onClick={() => onSwitch({ tag: outingTag })}
              >
                {labelByTag.get(outingTag) ?? outingTag}
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
                onClick={() => onSwitch({ tag: otherTag })}
              >
                {labelByTag.get(otherTag) ?? otherTag}
              </button>
            ))}
          </fieldset>

          {showStageFilter ? (
            <fieldset className="stage-chips" disabled={disabled}>
              <legend className="sr-only">{dict.stageLegend}</legend>
              <button
                type="button"
                className={
                  stage === "words"
                    ? "stage-chips__btn is-active"
                    : "stage-chips__btn"
                }
                onClick={() => onSwitch({ stage: "words" })}
              >
                {dict.stageWords}
              </button>
              <button
                type="button"
                className={
                  stage === "sentences"
                    ? "stage-chips__btn is-active"
                    : "stage-chips__btn"
                }
                onClick={() => onSwitch({ stage: "sentences" })}
              >
                {dict.stageSentences}
              </button>
            </fieldset>
          ) : null}
        </div>
      ) : null}

      <div className="study__toolbar">
        <fieldset className="direction-toggle" disabled={disabled}>
          <legend className="sr-only">{dict.directionLegend}</legend>
          <button
            type="button"
            className={
              direction === "id_to_nl"
                ? "direction-toggle__btn is-active"
                : "direction-toggle__btn"
            }
            onClick={() => onSwitch({ direction: "id_to_nl" })}
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
            onClick={() => onSwitch({ direction: "nl_to_id" })}
          >
            NL → ID
          </button>
        </fieldset>
      </div>
    </div>
  );
}
