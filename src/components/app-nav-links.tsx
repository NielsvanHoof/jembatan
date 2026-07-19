"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type AppNavLinksProps = {
  locale: Locale;
  dict: Dictionary;
  loggedIn: boolean;
};

/** Active tab from the URL — shared chrome stays mounted across study ↔ progress. */
function activeFromPath(pathname: string): "study" | "progress" | undefined {
  if (pathname.includes("/progress")) {
    return "progress";
  }
  if (pathname.includes("/study") || pathname.includes("/offline")) {
    return "study";
  }
  return undefined;
}

/**
 * Desktop nav links + phone tab bar.
 * Client-only so the active state updates without remounting AppNav.
 */
export function AppNavLinks({ locale, dict, loggedIn }: AppNavLinksProps) {
  const pathname = usePathname() ?? "";
  const active = activeFromPath(pathname);

  return (
    <>
      <nav className="app-nav__links" aria-label={dict.nav.aria}>
        <Link
          href={pathFor(locale, "/study")}
          className={active === "study" ? "is-active" : undefined}
          prefetch
        >
          {dict.nav.study}
        </Link>
        <Link
          href={pathFor(locale, "/progress")}
          className={active === "progress" ? "is-active" : undefined}
          prefetch
        >
          {dict.nav.progress}
        </Link>
        {loggedIn ? (
          <form action={logoutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="app-nav__logout">
              {dict.nav.logout}
            </button>
          </form>
        ) : (
          <Link href={pathFor(locale, "/login")}>{dict.nav.login}</Link>
        )}
      </nav>

      {loggedIn ? (
        <nav className="app-tabbar" aria-label={dict.nav.aria}>
          <Link
            href={pathFor(locale, "/study")}
            className={`app-tabbar__item${active === "study" ? " is-active" : ""}`}
            prefetch
          >
            {dict.nav.study}
          </Link>
          <Link
            href={pathFor(locale, "/progress")}
            className={`app-tabbar__item${active === "progress" ? " is-active" : ""}`}
            prefetch
          >
            {dict.nav.progress}
          </Link>
          <form action={logoutAction} className="app-tabbar__item-form">
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="app-tabbar__item">
              {dict.nav.logout}
            </button>
          </form>
        </nav>
      ) : null}
    </>
  );
}
