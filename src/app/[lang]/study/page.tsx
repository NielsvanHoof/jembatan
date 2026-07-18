import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
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
import { parseTag } from "@/features/study/lib/themes";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";

type StudyPageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    direction?: string;
    practice?: string;
    tag?: string;
    deck?: string;
  }>;
};

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

  const [cards, habit] = await Promise.all([
    getDueCards(direction, { practiceAll, tag, deckSlug }),
    getHabitSummary(direction, { tag, deckSlug }),
  ]);

  return (
    <div className="app-shell app-shell--study">
      <AppNav locale={lang} dict={dict} active="study" />
      <main className="app-main app-main--study">
        <StudySession
          // Remount only when the deck changes; theme/direction switch client-side.
          key={deckSlug}
          initialCards={cards}
          direction={direction}
          practiceAll={practiceAll}
          deckSlug={deckSlug}
          decks={decks}
          deckTags={deckTags}
          tag={tag}
          locale={lang}
          dict={dict.study}
          habit={habit}
        />
      </main>
    </div>
  );
}
