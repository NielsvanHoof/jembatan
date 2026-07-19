"use client";

import dynamic from "next/dynamic";
import type { StudyDirection } from "@/db/schema";
import type { StudyUiCopy } from "@/features/study/lib/study-ui-copy";
import type { StudyCard } from "@/features/study/types";

// Sentence builder stays out of the initial study chunk.
const SentenceBuilder = dynamic(
  () =>
    import("@/features/study/components/sentence-builder").then(
      (mod) => mod.SentenceBuilder,
    ),
  { ssr: false },
);

type StudyFlashcardProps = {
  card: StudyCard;
  direction: StudyDirection;
  dict: StudyUiCopy;
  revealed: boolean;
  isSentenceCard: boolean;
  onWordsCompleteChange: (complete: boolean) => void;
};

/** Front/back flashcard face, including sentence-builder wiring. */
export function StudyFlashcard({
  card,
  direction,
  dict,
  revealed,
  isSentenceCard,
  onWordsCompleteChange,
}: StudyFlashcardProps) {
  return (
    <article
      className={`flashcard${revealed || isSentenceCard ? " is-revealed" : ""}`}
      aria-live="polite"
    >
      <p className="flashcard__lang">
        {direction === "id_to_nl" ? dict.langId : dict.langNl}
      </p>
      <h1 className="flashcard__front">{card.front}</h1>

      {/* Sentence level: Duolingo-style build the daily line. */}
      {isSentenceCard ? (
        <div className="flashcard__back">
          <p className="flashcard__lang">
            {direction === "id_to_nl" ? dict.langNl : dict.langId}
          </p>
          <SentenceBuilder
            key={card.cardId}
            text={card.back}
            onCompleteChange={onWordsCompleteChange}
            hintLabel={dict.builderHint}
            tryAgainLabel={dict.builderTryAgain}
            correctLabel={dict.builderCorrect}
            wrongLabel={dict.builderWrong}
            showAnswerLabel={dict.showAnswer}
          />
        </div>
      ) : null}

      {revealed && !isSentenceCard ? (
        <div className="flashcard__back">
          <p className="flashcard__lang">
            {direction === "id_to_nl" ? dict.langNl : dict.langId}
          </p>
          <p className="flashcard__answer">{card.back}</p>
          {card.exampleFront && card.exampleBack ? (
            <p className="flashcard__example">
              <span>{card.exampleFront}</span>
              <span aria-hidden="true"> · </span>
              <span>{card.exampleBack}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
