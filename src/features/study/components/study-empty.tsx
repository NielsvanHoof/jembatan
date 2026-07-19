"use client";

import Link from "next/link";
import { BridgeMark } from "@/features/study/components/bridge-mark";
import type { StudyUiCopy } from "@/features/study/lib/study-ui-copy";
import type { Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type StudyEmptyProps = {
  dict: StudyUiCopy;
  locale: Locale;
  deckSlug: string;
  themeLabel: string | null;
  tag?: string;
  nextDueText: string | null;
  practiceAll: boolean;
  goalMet: boolean;
  pending: boolean;
  filtersLocked: boolean;
  onPracticeAgain: () => void;
  onClearTheme: () => void;
};

/** Done / empty board — next-due copy, habit goal, practice-again CTAs. */
export function StudyEmpty({
  dict,
  locale,
  deckSlug,
  themeLabel,
  tag,
  nextDueText,
  practiceAll,
  goalMet,
  pending,
  filtersLocked,
  onPracticeAgain,
  onClearTheme,
}: StudyEmptyProps) {
  return (
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
          onClick={onPracticeAgain}
        >
          {dict.practiceAgain}
        </button>
        {tag ? (
          <button
            type="button"
            className="btn btn--ghost"
            disabled={pending}
            onClick={onClearTheme}
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
  );
}
