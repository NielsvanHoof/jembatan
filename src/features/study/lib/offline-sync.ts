/**
 * Flush queued offline ratings when the network is back.
 */

import { reviewCardAction } from "@/features/study/actions/review";
import {
  listPendingReviews,
  removePendingReview,
} from "@/features/study/lib/offline-db";

let flushing = false;

/**
 * Replay pending reviews in order.
 * Stops on the first hard failure so we do not skip / reorder.
 */
export async function flushPendingReviews(): Promise<{
  synced: number;
  remaining: number;
}> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const remaining = (await listPendingReviews()).length;
    return { synced: 0, remaining };
  }
  if (flushing) {
    return { synced: 0, remaining: (await listPendingReviews()).length };
  }

  flushing = true;
  let synced = 0;
  try {
    const pending = await listPendingReviews();
    for (const item of pending) {
      try {
        const result = await reviewCardAction({
          progressId: item.progressId,
          rating: item.rating,
        });
        if (!result.ok) {
          // Card missing / bad rating — drop so the queue is not stuck.
          await removePendingReview(item.id);
          continue;
        }
        await removePendingReview(item.id);
        synced += 1;
      } catch {
        // Network blip — keep the rest for the next online event.
        break;
      }
    }
  } finally {
    flushing = false;
  }

  const remaining = (await listPendingReviews()).length;
  return { synced, remaining };
}

/** True when the failure looks like a network / offline problem. */
export function isNetworkFailure(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("failed to fetch") ||
      msg.includes("offline")
    );
  }
  return false;
}
