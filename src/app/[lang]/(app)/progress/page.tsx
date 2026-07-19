import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProgressStats } from "@/features/progress/actions";
import { ProgressPanel } from "@/features/progress/components/progress-panel";
import { listDecks, parseDeckSlug } from "@/features/study/lib/decks";
import { toStudyDeckOptions } from "@/features/study/lib/study-ui-copy";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/seo";

type ProgressPageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ deck?: string }>;
};

/** Auth-gated — keep out of the index. */
export async function generateMetadata({
  params,
}: ProgressPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    return {};
  }
  const dict = getDictionary(lang);
  return buildPageMetadata({
    locale: lang,
    path: "/progress",
    title: dict.meta.pages.progress,
    description: dict.progress.lede,
    robots: { index: false, follow: false },
  });
}

export default async function ProgressPage({
  params,
  searchParams,
}: ProgressPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const query = await searchParams;
  const deckSlug = await parseDeckSlug(query.deck);
  const dict = getDictionary(lang);
  const [stats, decks] = await Promise.all([
    getProgressStats({ deckSlug }),
    listDecks(),
  ]);

  return (
    <main className="app-main progress-page">
      <ProgressPanel
        locale={lang}
        dict={dict.progress}
        decks={toStudyDeckOptions(dict.study, decks)}
        initialDeckSlug={deckSlug}
        initialStats={stats}
      />
    </main>
  );
}
