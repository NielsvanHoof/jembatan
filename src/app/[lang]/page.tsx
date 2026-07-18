import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/auth";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type HomePageProps = {
  params: Promise<{ lang: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const session = await auth();
  const dict = getDictionary(lang);
  const primaryHref = session?.user
    ? pathFor(lang, "/belajar")
    : pathFor(lang, "/daftar");
  const primaryLabel = session?.user
    ? dict.landing.continue
    : dict.landing.start;

  return (
    <main className="landing">
      <div className="landing__top">
        <LanguageSwitcher locale={lang} dict={dict.lang} variant="landing" />
      </div>

      <div className="landing__stage">
        <h1 className="landing__brand">Jembatan</h1>

        {/* Signature: language bridge connecting ID and NL */}
        <div className="landing__bridge" aria-hidden="true">
          <span>ID</span>
          <span className="landing__bridge-line" />
          <span>NL</span>
        </div>

        <p className="landing__headline">{dict.landing.headline}</p>
        <p className="landing__lede">{dict.landing.lede}</p>

        <div className="landing__cta">
          <Link href={primaryHref} className="btn btn--primary">
            {primaryLabel}
          </Link>
          {!session?.user ? (
            <Link href={pathFor(lang, "/masuk")} className="btn btn--ghost">
              {dict.landing.hasAccount}
            </Link>
          ) : (
            <Link href={pathFor(lang, "/kemajuan")} className="btn btn--ghost">
              {dict.landing.seeProgress}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
