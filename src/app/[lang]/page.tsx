import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/auth";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";
import { SITE_URL } from "@/lib/seo";

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
    ? pathFor(lang, "/study")
    : pathFor(lang, "/register");
  const primaryLabel = session?.user
    ? dict.landing.continue
    : dict.landing.start;

  // Educational web app schema — helps rich results understand the product.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Jembatan",
    url: `${SITE_URL}${pathFor(lang, "/")}`,
    description: dict.meta.description,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    inLanguage: [lang, "nl"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
  };

  return (
    <main className="landing">
      <script
        type="application/ld+json"
        // JSON-LD must be a raw script for crawlers; content is from our dict.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: required for JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="landing__top">
        <LanguageSwitcher locale={lang} dict={dict.lang} variant="landing" />
      </div>

      <div className="landing__stage">
        <h1 className="landing__brand">Jembatan</h1>

        {/* Signature: language bridge connecting ID and NL */}
        <div className="bridge-mark" aria-hidden="true">
          <span>ID</span>
          <span className="bridge-mark__line" />
          <span>NL</span>
        </div>

        <p className="landing__headline">{dict.landing.headline}</p>
        <p className="landing__lede">{dict.landing.lede}</p>

        <div className="landing__cta">
          <Link href={primaryHref} className="btn btn--primary">
            {primaryLabel}
          </Link>
          {!session?.user ? (
            <Link href={pathFor(lang, "/login")} className="btn btn--ghost">
              {dict.landing.hasAccount}
            </Link>
          ) : (
            <Link href={pathFor(lang, "/progress")} className="btn btn--ghost">
              {dict.landing.seeProgress}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
