type StudyOfflineBannerProps = {
  syncNote: string | null;
  pendingSync: number;
  syncPendingFallback: string;
};

/** Offline / pending-sync status line above the stage bar. */
export function StudyOfflineBanner({
  syncNote,
  pendingSync,
  syncPendingFallback,
}: StudyOfflineBannerProps) {
  if (!syncNote && pendingSync <= 0) {
    return null;
  }

  return (
    <p className="offline-banner" role="status">
      {syncNote ?? syncPendingFallback}
      {pendingSync > 0 ? ` (${pendingSync})` : null}
    </p>
  );
}
