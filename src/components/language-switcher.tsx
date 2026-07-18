"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { locales } from "@/lib/i18n/dictionaries";

type LanguageSwitcherProps = {
  locale: Locale;
  dict: Dictionary["lang"];
  /** Compact corner control on the landing page */
  variant?: "nav" | "landing";
};

/**
 * Swap the /id|/en URL prefix (Next.js i18n routing).
 * Keeps the rest of the path + query string intact.
 */
export function LanguageSwitcher({
  locale,
  dict,
  variant = "nav",
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function select(next: Locale) {
    if (next === locale) {
      return;
    }

    const segments = pathname.split("/");
    // pathname looks like "", "id", "study", ...
    if (segments.length > 1 && locales.includes(segments[1] as Locale)) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }

    const query = typeof window !== "undefined" ? window.location.search : "";
    router.push(`${segments.join("/") || "/"}${query}`);
  }

  return (
    <fieldset
      className={
        variant === "landing"
          ? "lang-switch lang-switch--landing"
          : "lang-switch"
      }
    >
      <legend className="sr-only">{dict.label}</legend>
      <button
        type="button"
        className={
          locale === "id" ? "lang-switch__btn is-active" : "lang-switch__btn"
        }
        onClick={() => select("id")}
        aria-pressed={locale === "id"}
      >
        {dict.id}
      </button>
      <button
        type="button"
        className={
          locale === "en" ? "lang-switch__btn is-active" : "lang-switch__btn"
        }
        onClick={() => select("en")}
        aria-pressed={locale === "en"}
      >
        {dict.en}
      </button>
    </fieldset>
  );
}
