"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StudySession } from "@/features/study/components/study-session";
import { loadLatestOfflineSession } from "@/features/study/lib/offline-db";
import { toStudyUiCopy } from "@/features/study/lib/study-ui-copy";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

import "../styles.css";

type OfflineStudyProps = {
  locale: Locale;
  dict: Dictionary;
};

/**
 * Offline study entry: resume today’s cached due cards from IndexedDB.
 * Shell (nav) is rendered by the server page around this component.
 */
export function OfflineStudy({ locale, dict }: OfflineStudyProps) {
  const [ready, setReady] = useState(false);
  const [session, setSession] =
    useState<Awaited<ReturnType<typeof loadLatestOfflineSession>>>(null);

  useEffect(() => {
    let cancelled = false;
    void loadLatestOfflineSession().then((row) => {
      if (!cancelled) {
        setSession(row);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <p className="lede">{dict.offline.loading}</p>;
  }

  if (session && session.cards.length > 0) {
    return (
      <>
        <p className="offline-banner" role="status">
          {dict.offline.cachedBanner}
        </p>
        <StudySession
          initialCards={session.cards}
          direction={session.direction}
          practiceAll={session.practiceAll}
          deckSlug={session.deckSlug}
          decks={[]}
          tagOptions={[]}
          tag={session.tag}
          stage={session.stage}
          locale={locale}
          dict={toStudyUiCopy(dict.study)}
          habit={session.habit}
          fromCache
        />
      </>
    );
  }

  return (
    <div className="study-empty">
      {/* Same signature mark as study done — calm empty offline state */}
      <div className="bridge-mark bridge-mark--compact" aria-hidden="true">
        <span>ID</span>
        <span className="bridge-mark__line" />
        <span>NL</span>
      </div>
      <h1>{dict.offline.emptyTitle}</h1>
      <p>{dict.offline.emptyBody}</p>
      <div className="study-empty__actions">
        <Link href={pathFor(locale, "/study")} className="btn btn--primary">
          {dict.offline.openStudy}
        </Link>
      </div>
    </div>
  );
}
