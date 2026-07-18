import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/auth";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type AppNavProps = {
  locale: Locale;
  dict: Dictionary;
};

/** Compact top nav for study / auth pages. */
export async function AppNav({ locale, dict }: AppNavProps) {
  const session = await auth();

  return (
    <header className="app-nav">
      <Link href={pathFor(locale)} className="app-nav__brand">
        Jembatan
      </Link>
      <div className="app-nav__right">
        <LanguageSwitcher locale={locale} dict={dict.lang} />
        <nav className="app-nav__links" aria-label={dict.nav.aria}>
          <Link href={pathFor(locale, "/belajar")}>{dict.nav.study}</Link>
          <Link href={pathFor(locale, "/kemajuan")}>{dict.nav.progress}</Link>
          {session?.user ? (
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="app-nav__logout">
                {dict.nav.logout}
              </button>
            </form>
          ) : (
            <Link href={pathFor(locale, "/masuk")}>{dict.nav.login}</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
