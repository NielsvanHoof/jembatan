"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reviewCardAction, type StudyCard } from "@/app/actions/study";
import type { StudyDirection } from "@/db/schema";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type StudySessionProps = {
  initialCards: StudyCard[];
  direction: StudyDirection;
  practiceAll: boolean;
  locale: Locale;
  dict: Dictionary["study"];
};

const RATING_KEYS = ["again", "hard", "good", "easy"] as const;

/** One-card-at-a-time study loop with flip + SM-2 ratings. */
export function StudySession({
  initialCards,
  direction,
  practiceAll,
  locale,
  dict,
}: StudySessionProps) {
  const router = useRouter();
  const [queue, setQueue] = useState(initialCards);
  const [revealed, setRevealed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const current = queue[0];
  const remaining = queue.length;

  function switchDirection(next: StudyDirection) {
    const params = new URLSearchParams();
    params.set("arah", next);
    if (practiceAll) {
      params.set("latihan", "1");
    }
    router.push(`${pathFor(locale, "/belajar")}?${params.toString()}`);
  }

  function onRate(rating: (typeof RATING_KEYS)[number]) {
    if (!current || pending) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await reviewCardAction({
        progressId: current.progressId,
        rating,
      });

      if (!result.ok) {
        setError(dict.errors[result.error]);
        return;
      }

      // "Again" cards come back later in the same session.
      setRevealed(false);
      setQueue((prev) => {
        const [, ...rest] = prev;
        if (rating === "again") {
          return [...rest, current];
        }
        return rest;
      });
    });
  }

  return (
    <div className="study">
      <div className="study__toolbar">
        <fieldset className="direction-toggle">
          <legend className="sr-only">{dict.directionLegend}</legend>
          <button
            type="button"
            className={
              direction === "id_to_nl"
                ? "direction-toggle__btn is-active"
                : "direction-toggle__btn"
            }
            onClick={() => switchDirection("id_to_nl")}
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
            onClick={() => switchDirection("nl_to_id")}
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
          <h1>{dict.emptyTitle}</h1>
          <p>{dict.emptyBody}</p>
          <div className="study-empty__actions">
            <Link
              href={`${pathFor(locale, "/belajar")}?arah=${direction}&latihan=1`}
              className="btn btn--primary"
            >
              {dict.practiceAgain}
            </Link>
            <Link
              href={pathFor(locale, "/kemajuan")}
              className="btn btn--ghost"
            >
              {dict.seeProgress}
            </Link>
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
        </>
      )}
    </div>
  );
}
