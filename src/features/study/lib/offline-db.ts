/**
 * IndexedDB cache for today’s study session + pending rating sync.
 * Used when the phone is offline (train / weak signal).
 */

import type { StudyDirection } from "@/db/schema";
import type { OfflineSession, PendingReview } from "@/features/study/types";
import { calendarDayKey } from "@/lib/habit";

const DB_NAME = "jembatan-offline";
const DB_VERSION = 1;
const SESSION_STORE = "sessions";
const PENDING_STORE = "pendingReviews";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () =>
      reject(request.error ?? new Error("idb open failed"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { keyPath: "id" });
      }
    };
  });
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("idb request failed"));
  });
}

export function sessionCacheKey(input: {
  deckSlug: string;
  direction: StudyDirection;
  tag?: string;
  practiceAll: boolean;
  dayKey?: string;
}): string {
  const day = input.dayKey ?? calendarDayKey(new Date());
  const tag = input.tag ?? "all";
  const mode = input.practiceAll ? "practice" : "due";
  return `${day}|${input.deckSlug}|${input.direction}|${tag}|${mode}`;
}

/** Persist today’s due (or practice) queue for offline reopen. */
export async function saveOfflineSession(
  session: Omit<OfflineSession, "key" | "dayKey" | "savedAt"> & {
    dayKey?: string;
  },
): Promise<void> {
  const dayKey = session.dayKey ?? calendarDayKey(new Date());
  const record: OfflineSession = {
    key: sessionCacheKey({ ...session, dayKey }),
    dayKey,
    deckSlug: session.deckSlug,
    direction: session.direction,
    tag: session.tag,
    practiceAll: session.practiceAll,
    cards: session.cards,
    habit: session.habit,
    savedAt: new Date().toISOString(),
  };

  const db = await openDb();
  try {
    const tx = db.transaction(SESSION_STORE, "readwrite");
    await reqToPromise(tx.objectStore(SESSION_STORE).put(record));
  } finally {
    db.close();
  }
}

export async function loadOfflineSession(input: {
  deckSlug: string;
  direction: StudyDirection;
  tag?: string;
  practiceAll: boolean;
}): Promise<OfflineSession | null> {
  const key = sessionCacheKey(input);
  const db = await openDb();
  try {
    const tx = db.transaction(SESSION_STORE, "readonly");
    const row = await reqToPromise(tx.objectStore(SESSION_STORE).get(key));
    return (row as OfflineSession | undefined) ?? null;
  } finally {
    db.close();
  }
}

/** Most recently saved session for today (any deck/direction/theme). */
export async function loadLatestOfflineSession(): Promise<OfflineSession | null> {
  const today = calendarDayKey(new Date());
  const db = await openDb();
  try {
    const tx = db.transaction(SESSION_STORE, "readonly");
    const all = (await reqToPromise(
      tx.objectStore(SESSION_STORE).getAll(),
    )) as OfflineSession[];
    const todays = all
      .filter((row) => row.dayKey === today)
      .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
    return todays[0] ?? null;
  } finally {
    db.close();
  }
}

export async function enqueuePendingReview(
  review: Omit<PendingReview, "id" | "queuedAt">,
): Promise<void> {
  const record: PendingReview = {
    id: `${review.progressId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    progressId: review.progressId,
    rating: review.rating,
    queuedAt: new Date().toISOString(),
  };
  const db = await openDb();
  try {
    const tx = db.transaction(PENDING_STORE, "readwrite");
    await reqToPromise(tx.objectStore(PENDING_STORE).put(record));
  } finally {
    db.close();
  }
}

export async function listPendingReviews(): Promise<PendingReview[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(PENDING_STORE, "readonly");
    const rows = (await reqToPromise(
      tx.objectStore(PENDING_STORE).getAll(),
    )) as PendingReview[];
    return rows.sort((a, b) => (a.queuedAt < b.queuedAt ? -1 : 1));
  } finally {
    db.close();
  }
}

export async function removePendingReview(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(PENDING_STORE, "readwrite");
    await reqToPromise(tx.objectStore(PENDING_STORE).delete(id));
  } finally {
    db.close();
  }
}

export async function countPendingReviews(): Promise<number> {
  const db = await openDb();
  try {
    const tx = db.transaction(PENDING_STORE, "readonly");
    return await reqToPromise(tx.objectStore(PENDING_STORE).count());
  } finally {
    db.close();
  }
}
