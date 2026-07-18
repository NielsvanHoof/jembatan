"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Root error boundary — must render its own html/body.
 * Copy is English-only here because the locale layout may have failed.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          fontFamily: "system-ui, sans-serif",
          background: "#eef4f6",
          color: "#14232c",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "28rem" }}>
          <h1
            style={{
              fontWeight: 500,
              fontSize: "1.75rem",
              margin: "0 0 0.75rem",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.5, opacity: 0.85 }}>
            The app hit an unexpected error. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "2.75rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "0.65rem",
              border: "none",
              background: "#1b3a4b",
              color: "#f8fbfd",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
