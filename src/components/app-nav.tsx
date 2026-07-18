import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/auth";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type AppNavProps = {
  locale: Locale;
  dict: Dictionary;
  /** Highlights the active tab on phone bottom bar. */
  active?: "study" | "progress";
};

/** Compact top bar + phone bottom tabs for study / progress. */
export async function AppNav({ locale, dict, active }: AppNavProps) {
  const session = await auth();
  const loggedIn = Boolean(session?.user);

  return (
    <>
      <header className="app-nav">
        <Link href={pathFor(locale)} className="app-nav__brand">
          Jembatan
        </Link>
        <div className="app-nav__right">
          <LanguageSwitcher locale={locale} dict={dict.lang} />
          {/* Desktop / wider screens keep inline links */}
          <nav className="app-nav__links" aria-label={dict.nav.aria}>
            <Link
              href={pathFor(locale, "/study")}
              className={active === "study" ? "is-active" : undefined}
            >
              {dict.nav.study}
            </Link>
            <Link
              href={pathFor(locale, "/progress")}
              className={active === "progress" ? "is-active" : undefined}
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
        </div>
      </header>

      {/* Thumb-friendly bottom tabs — phone only, logged-in study flows */}
      {loggedIn ? (
        <nav className="app-tabbar" aria-label={dict.nav.aria}>
          <Link
            href={pathFor(locale, "/study")}
            className={`app-tabbar__item${active === "study" ? " is-active" : ""}`}
          >
            {dict.nav.study}
          </Link>
          <Link
            href={pathFor(locale, "/progress")}
            className={`app-tabbar__item${active === "progress" ? " is-active" : ""}`}
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
