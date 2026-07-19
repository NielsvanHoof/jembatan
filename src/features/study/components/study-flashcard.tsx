"use client";

import dynamic from "next/dynamic";
import type { StudyDirection } from "@/db/schema";
import { SpeakButton } from "@/features/study/components/speak-button";
import {
  answerAudioLocale,
  promptAudioLocale,
} from "@/features/study/lib/card-audio-path";
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
  const frontLocale = promptAudioLocale(direction);
  const backLocale = answerAudioLocale(direction);

  return (
    <article
      className={`flashcard${revealed || isSentenceCard ? " is-revealed" : ""}`}
      aria-live="polite"
    >
      <p className="flashcard__lang">
        {direction === "id_to_nl" ? dict.langId : dict.langNl}
      </p>

      {/* Phrase + speak sit together so the control is hard to miss. */}
      <div className="flashcard__phrase">
        <h1 className="flashcard__front">{card.front}</h1>
        <SpeakButton
          text={card.front}
          locale={frontLocale}
          label={dict.listen}
        />
      </div>

      {/* Sentence level: Duolingo-style build the daily line. */}
      {isSentenceCard ? (
        <div className="flashcard__back">
          <div className="flashcard__phrase flashcard__phrase--answer">
            <p className="flashcard__lang">
              {direction === "id_to_nl" ? dict.langNl : dict.langId}
            </p>
            <SpeakButton
              text={card.back}
              locale={backLocale}
              label={dict.listen}
            />
          </div>
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
          <div className="flashcard__phrase flashcard__phrase--answer">
            <p className="flashcard__answer">{card.back}</p>
            <SpeakButton
              text={card.back}
              locale={backLocale}
              label={dict.listen}
            />
          </div>
          {card.exampleFront && card.exampleBack ? (
            <div className="flashcard__example">
              <span className="flashcard__example-line">
                <span>{card.exampleFront}</span>
                <SpeakButton
                  text={card.exampleFront}
                  locale={frontLocale}
                  label={dict.listen}
                  compact
                />
              </span>
              <span aria-hidden="true"> · </span>
              <span className="flashcard__example-line">
                <span>{card.exampleBack}</span>
                <SpeakButton
                  text={card.exampleBack}
                  locale={backLocale}
                  label={dict.listen}
                  compact
                />
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
