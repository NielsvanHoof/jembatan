"use client";

import { useEffect } from "react";
import { flushPendingReviews } from "@/features/study/lib/offline-sync";
import type { Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type PwaRegisterProps = {
  locale: Locale;
};

/**
 * Registers the service worker and warms the offline page cache.
 * Also flushes any queued ratings when the app comes online.
 */
export function PwaRegister({ locale }: PwaRegisterProps) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // Production-only registration avoids SW fighting Next.js HMR in dev.
    // Also unregister any leftover SW from a prior `npm start` test.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          void reg.unregister();
        }
      });
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Install can fail on first visit; ignore — next load will retry.
    });

    // Warm offline fallback so navigations have somewhere to go.
    const offlinePath = pathFor(locale, "/offline");
    void caches.open("jembatan-v2").then(async (cache) => {
      try {
        const response = await fetch(offlinePath, {
          credentials: "same-origin",
        });
        if (response.ok) {
          await cache.put(offlinePath, response);
        }
      } catch {
        // Offline already — nothing to warm.
      }
    });
  }, [locale]);

  useEffect(() => {
    function onOnline() {
      void flushPendingReviews();
    }

    window.addEventListener("online", onOnline);
    // Flush once on mount in case ratings were queued earlier.
    void flushPendingReviews();

    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
