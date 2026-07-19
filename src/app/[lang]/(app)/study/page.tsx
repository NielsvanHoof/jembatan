import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDueCards,
  getHabitSummary,
  parseDirection,
} from "@/features/study/actions";
import { StudySession } from "@/features/study/components/study-session";
import {
  getDeckTags,
  listDecks,
  parseDeckSlug,
} from "@/features/study/lib/decks";
import { parseStage, parseTag } from "@/features/study/lib/themes";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/seo";

type StudyPageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    direction?: string;
    practice?: string;
    tag?: string;
    stage?: string;
    deck?: string;
  }>;
};

/** Auth-gated — keep out of the index even if a crawler somehow reaches it. */
export async function generateMetadata({
  params,
}: StudyPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    return {};
  }
  const dict = getDictionary(lang);
  return buildPageMetadata({
    locale: lang,
    path: "/study",
    title: dict.meta.pages.study,
    description: dict.meta.description,
    robots: { index: false, follow: false },
  });
}

export default async function StudyPage({
  params,
  searchParams,
}: StudyPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const query = await searchParams;
  const direction = await parseDirection(query.direction);
  const practiceAll = query.practice === "1";
  const deckSlug = await parseDeckSlug(query.deck);
  const requestedTag = parseTag(query.tag);
  const dict = getDictionary(lang);

  const [decks, deckTags] = await Promise.all([
    listDecks(),
    getDeckTags(deckSlug),
  ]);

  // Ignore theme filters that aren't in this deck.
  const tag =
    requestedTag && deckTags.includes(requestedTag) ? requestedTag : undefined;
  // Outing themes default to Level 1 (words); other themes ignore stage.
  const stage = parseStage(query.stage, tag);

  const [cards, habit] = await Promise.all([
    getDueCards(direction, { practiceAll, tag, stage, deckSlug }),
    getHabitSummary(direction, { tag, stage, deckSlug }),
  ]);

  return (
    <main className="app-main app-main--study">
      <StudySession
        // Soft-switch keeps this mounted; no key={deck} remount.
        initialCards={cards}
        direction={direction}
        practiceAll={practiceAll}
        deckSlug={deckSlug}
        decks={decks}
        deckTags={deckTags}
        tag={tag}
        stage={stage}
        locale={lang}
        dict={dict.study}
        habit={habit}
      />
    </main>
  );
}
