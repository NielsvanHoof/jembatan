"use client";

import { useRef, useState } from "react";
import {
  type AudioLocale,
  audioPath,
} from "@/features/study/lib/card-audio-path";

type SpeakButtonProps = {
  text: string;
  locale: AudioLocale;
  /** Visible + accessible label, e.g. "Listen" / "Dengarkan". */
  label: string;
  /** Smaller control for example lines. */
  compact?: boolean;
};

/**
 * Plays a pre-generated Chirp clip for the given phrase.
 * Missing files fail quietly (button marks unavailable).
 */
export function SpeakButton({
  text,
  locale,
  label,
  compact = false,
}: SpeakButtonProps) {
  const [playing, setPlaying] = useState(false);
  const [missing, setMissing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleClick() {
    if (playing || missing || !text.trim()) {
      return;
    }

    // Stop any in-flight clip from a previous tap on this button.
    audioRef.current?.pause();

    const src = await audioPath(locale, text);
    const audio = new Audio(src);
    audioRef.current = audio;
    setPlaying(true);

    const finish = () => {
      setPlaying(false);
    };

    audio.addEventListener("ended", finish);
    audio.addEventListener("error", () => {
      setMissing(true);
      finish();
    });

    try {
      await audio.play();
    } catch {
      setMissing(true);
      finish();
    }
  }

  return (
    <button
      type="button"
      className={`speak-btn${compact ? " speak-btn--compact" : ""}${playing ? " is-playing" : ""}${missing ? " is-missing" : ""}`}
      onClick={handleClick}
      disabled={playing || missing}
      aria-label={label}
      title={missing ? undefined : label}
    >
      <svg
        viewBox="0 0 24 24"
        width={compact ? 14 : 18}
        height={compact ? 14 : 18}
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
        />
      </svg>
      {/* Text label so the control is obvious next to the phrase. */}
      {!compact ? <span className="speak-btn__label">{label}</span> : null}
    </button>
  );
}
