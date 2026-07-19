"use client";

import { useEffect, useState } from "react";
import { splitSentenceWords } from "@/features/study/lib/themes";

type Tile = {
  /** Stable id so duplicate words (e.g. "ik" twice) stay distinct. */
  id: string;
  word: string;
};

type SentenceBuilderProps = {
  /** Correct answer sentence to rebuild. */
  text: string;
  /** True when the learner built the sentence correctly. */
  onCompleteChange: (complete: boolean) => void;
  hintLabel: string;
  tryAgainLabel: string;
  correctLabel: string;
  wrongLabel: string;
  showAnswerLabel: string;
};

/** Fisher–Yates shuffle (mutates a copy). */
function shuffleTiles(tiles: Tile[]): Tile[] {
  const copy = [...tiles];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const left = copy[i];
    const right = copy[j];
    if (left && right) {
      copy[i] = right;
      copy[j] = left;
    }
  }
  return copy;
}

function tilesFromSentence(text: string): Tile[] {
  return splitSentenceWords(text).map((word, index) => ({
    id: `${index}-${word}`,
    word,
  }));
}

/**
 * Duolingo-style sentence builder for outing Level 2.
 * Tap bank words to build the line; tap a built word to put it back.
 */
export function SentenceBuilder({
  text,
  onCompleteChange,
  hintLabel,
  tryAgainLabel,
  correctLabel,
  wrongLabel,
  showAnswerLabel,
}: SentenceBuilderProps) {
  const correctWords = splitSentenceWords(text);
  // Bank order is fixed for this mount (parent remounts with key=cardId).
  const [bank] = useState(() => shuffleTiles(tilesFromSentence(text)));
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"building" | "correct" | "wrong">(
    "building",
  );

  // Empty / missing sentence — unlock ratings without blocking.
  useEffect(() => {
    if (correctWords.length === 0) {
      onCompleteChange(true);
    }
  }, [correctWords.length, onCompleteChange]);

  const picked = pickedIds
    .map((id) => bank.find((tile) => tile.id === id))
    .filter((tile): tile is Tile => Boolean(tile));
  const available = bank.filter((tile) => !pickedIds.includes(tile.id));
  const locked = status === "correct";

  function evaluate(nextIds: string[]) {
    if (nextIds.length !== correctWords.length) {
      setStatus("building");
      return;
    }
    const built = nextIds.map(
      (id) => bank.find((tile) => tile.id === id)?.word ?? "",
    );
    const ok = built.every((word, index) => word === correctWords[index]);
    if (ok) {
      setStatus("correct");
      // Defer parent setState — never call it inside a state updater.
      queueMicrotask(() => onCompleteChange(true));
      return;
    }
    setStatus("wrong");
  }

  function pick(id: string) {
    if (locked) {
      return;
    }
    const next = [...pickedIds, id];
    setPickedIds(next);
    evaluate(next);
  }

  function unpick(id: string) {
    if (locked) {
      return;
    }
    const next = pickedIds.filter((pickedId) => pickedId !== id);
    setPickedIds(next);
    setStatus("building");
  }

  function tryAgain() {
    setPickedIds([]);
    setStatus("building");
  }

  function revealAnswer() {
    // Show the full line in order and let her rate (often "Again").
    const orderedIds = [...bank]
      .sort((a, b) => {
        const ai = Number(a.id.split("-")[0]);
        const bi = Number(b.id.split("-")[0]);
        return ai - bi;
      })
      .map((tile) => tile.id);
    setPickedIds(orderedIds);
    setStatus("correct");
    queueMicrotask(() => onCompleteChange(true));
  }

  return (
    <div className="sentence-builder">
      <p className="sentence-builder__hint">{hintLabel}</p>

      {/* Built sentence strip — tap a chip to return it to the bank */}
      <div
        className={
          status === "wrong"
            ? "sentence-builder__slot is-wrong"
            : status === "correct"
              ? "sentence-builder__slot is-correct"
              : "sentence-builder__slot"
        }
        aria-live="polite"
      >
        {picked.length === 0 ? (
          <span className="sentence-builder__placeholder">…</span>
        ) : (
          <ul className="sentence-builder__row">
            {picked.map((tile) => (
              <li key={tile.id}>
                <button
                  type="button"
                  className="sentence-builder__chip is-picked"
                  disabled={locked}
                  onClick={() => unpick(tile.id)}
                >
                  {tile.word}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status === "correct" ? (
        <p className="sentence-builder__feedback is-correct" role="status">
          {correctLabel}
        </p>
      ) : null}
      {status === "wrong" ? (
        <p className="sentence-builder__feedback is-wrong" role="status">
          {wrongLabel}
        </p>
      ) : null}

      {/* Word bank */}
      {available.length > 0 ? (
        <ul className="sentence-builder__bank">
          {available.map((tile) => (
            <li key={tile.id}>
              <button
                type="button"
                className="sentence-builder__chip"
                disabled={locked}
                onClick={() => pick(tile.id)}
              >
                {tile.word}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {status === "wrong" ? (
        <div className="sentence-builder__actions">
          <button
            type="button"
            className="btn btn--primary btn--wide"
            onClick={tryAgain}
          >
            {tryAgainLabel}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--wide"
            onClick={revealAnswer}
          >
            {showAnswerLabel}
          </button>
        </div>
      ) : null}

      {/* Escape hatch before finishing (stuck / want to skip). */}
      {status === "building" && pickedIds.length > 0 ? (
        <button
          type="button"
          className="btn btn--ghost btn--wide"
          onClick={revealAnswer}
        >
          {showAnswerLabel}
        </button>
      ) : null}
    </div>
  );
}
