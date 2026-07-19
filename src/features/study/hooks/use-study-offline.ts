"use client";

import { useEffect, useState } from "react";
import type { StudyDirection } from "@/db/schema";
import type {
  CardStage,
  HabitSummary,
  StudyCard,
} from "@/features/study/types";

type OfflineSessionSnapshot = {
  deckSlug: string;
  direction: StudyDirection;
  tag?: string;
  stage?: CardStage;
  practiceAll: boolean;
  cards: StudyCard[];
  habit: HabitSummary;
  reviewedToday: number;
};

type UseStudyOfflineArgs = {
  /** True when cards came from IndexedDB (offline resume). */
  fromCache: boolean;
  syncPendingCopy: string;
  syncDoneCopy: string;
  /** Live session dims for IndexedDB persist (from useStudyFilters). */
  session: OfflineSessionSnapshot;
};

/**
 * Online/offline banner state, IDB session persist, and reconnect flush.
 * Rating flow updates pendingSync / syncNote via the returned setters.
 */
export function useStudyOffline({
  fromCache,
  syncPendingCopy,
  syncDoneCopy,
  session,
}: UseStudyOfflineArgs) {
  const [pendingSync, setPendingSync] = useState(0);
  const [syncNote, setSyncNote] = useState<string | null>(
    fromCache ? syncPendingCopy : null,
  );
  const [offline, setOffline] = useState(false);

  // Theme / direction / deck switches need the network (except cached resume).
  const filtersLocked = fromCache || offline;

  // Cache today’s queue for offline reopen — IDB helpers load in a separate chunk.
  useEffect(() => {
    void import("@/features/study/lib/offline-db").then(
      ({ saveOfflineSession }) =>
        saveOfflineSession({
          deckSlug: session.deckSlug,
          direction: session.direction,
          tag: session.tag,
          stage: session.stage,
          practiceAll: session.practiceAll,
          cards: session.cards,
          habit: { ...session.habit, reviewedToday: session.reviewedToday },
        }),
    );
  }, [
    session.cards,
    session.deckSlug,
    session.direction,
    session.tag,
    session.stage,
    session.practiceAll,
    session.habit,
    session.reviewedToday,
  ]);

  useEffect(() => {
    // Read onLine only after mount — never in the initial render.
    setOffline(!navigator.onLine);

    void import("@/features/study/lib/offline-db").then(
      ({ countPendingReviews }) => countPendingReviews().then(setPendingSync),
    );

    function onOnline() {
      setOffline(false);
      void import("@/features/study/lib/offline-sync").then(
        ({ flushPendingReviews }) =>
          flushPendingReviews().then(({ remaining: left }) => {
            setPendingSync(left);
            if (left === 0) {
              setSyncNote(syncDoneCopy);
            }
          }),
      );
    }
    function onOffline() {
      setOffline(true);
      setSyncNote(syncPendingCopy);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [syncDoneCopy, syncPendingCopy]);

  return {
    offline,
    filtersLocked,
    pendingSync,
    setPendingSync,
    syncNote,
    setSyncNote,
  };
}
