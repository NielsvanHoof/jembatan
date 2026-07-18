"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Localized segment error UI — reports to Sentry, offers retry. */
export default function LangError({ error, reset }: ErrorPageProps) {
  const pathname = usePathname();
  const segment = pathname?.split("/").filter(Boolean)[0];
  const locale: Locale = isLocale(segment) ? segment : "id";
  const dict = getDictionary(locale);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="app-shell">
      <main className="app-main auth-page">
        <h1>{dict.error.title}</h1>
        <p className="lede">{dict.error.body}</p>
        {error.digest ? (
          <p className="form-error" style={{ opacity: 0.7 }}>
            {error.digest}
          </p>
        ) : null}
        <div className="study-empty__actions">
          <button type="button" className="btn btn--primary" onClick={reset}>
            {dict.error.retry}
          </button>
          <Link href={pathFor(locale)} className="btn btn--ghost">
            {dict.error.home}
          </Link>
        </div>
      </main>
    </div>
  );
}
