/**
 * Daily habit helpers for study goals and streaks.
 * Calendar days use Europe/Amsterdam (learner lives in NL).
 */

export const DAILY_REVIEW_GOAL = 15;
/** Max cards pulled into one due session. */
export const SESSION_CARD_LIMIT = 20;
/** Max never-reviewed cards introduced in one due session. */
export const NEW_CARD_LIMIT = 10;

const STUDY_TZ = "Europe/Amsterdam";

/** YYYY-MM-DD in the study timezone. */
export function calendarDayKey(
  date: Date,
  timeZone: string = STUDY_TZ,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Instant when the Amsterdam calendar day of `now` started.
 * Used to filter "reviewed today" in SQL.
 */
export function startOfStudyDay(now: Date = new Date()): Date {
  const day = calendarDayKey(now);
  const anchor = Date.parse(`${day}T00:00:00.000Z`);
  let lo = anchor - 14 * 60 * 60 * 1000;
  let hi = anchor + 14 * 60 * 60 * 1000;

  // Binary search for the first UTC ms that formats as `day` in Amsterdam.
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (calendarDayKey(new Date(mid)) >= day) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return new Date(hi);
}

/** Previous calendar day key (Amsterdam). */
export function previousDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  return calendarDayKey(new Date(noonUtc - 24 * 60 * 60 * 1000));
}

/**
 * Count consecutive study days ending today (or yesterday if not yet today).
 * `dayKeys` should be unique YYYY-MM-DD strings, newest first.
 */
export function computeStreakDays(
  dayKeysNewestFirst: string[],
  todayKey: string = calendarDayKey(new Date()),
): number {
  if (dayKeysNewestFirst.length === 0) {
    return 0;
  }

  const set = new Set(dayKeysNewestFirst);
  let cursor = todayKey;

  // If nothing reviewed today, allow streak to continue from yesterday.
  if (!set.has(cursor)) {
    cursor = previousDayKey(cursor);
    if (!set.has(cursor)) {
      return 0;
    }
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = previousDayKey(cursor);
  }
  return streak;
}

export type NextDueLabel =
  | { kind: "now" }
  | { kind: "hours"; hours: number }
  | { kind: "days"; days: number };

/** Human-friendly bucket for the next scheduled card. */
export function nextDueLabel(
  nextDueAt: Date | null,
  now: Date = new Date(),
): NextDueLabel | null {
  if (!nextDueAt) {
    return null;
  }
  const ms = nextDueAt.getTime() - now.getTime();
  if (ms <= 0) {
    return { kind: "now" };
  }
  const hours = Math.max(1, Math.round(ms / (60 * 60 * 1000)));
  if (hours < 24) {
    return { kind: "hours", hours };
  }
  const days = Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
  return { kind: "days", days };
}
