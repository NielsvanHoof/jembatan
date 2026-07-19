import Link from "next/link";
import { AppNavLinks } from "@/components/app-nav-links";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/auth";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type AppNavProps = {
  locale: Locale;
  dict: Dictionary;
};

/**
 * Shared chrome: brand + language + study/progress tabs.
 * Lives in the (app) layout so study ↔ progress does not remount the header.
 */
export async function AppNav({ locale, dict }: AppNavProps) {
  const session = await auth();
  const loggedIn = Boolean(session?.user);

  return (
    <header className="app-nav">
      <Link href={pathFor(locale)} className="app-nav__brand">
        Jembatan
      </Link>
      <div className="app-nav__right">
        <LanguageSwitcher locale={locale} dict={dict.lang} />
        <AppNavLinks locale={locale} dict={dict} loggedIn={loggedIn} />
      </div>
    </header>
  );
}
