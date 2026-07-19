import type { Metadata } from "next";
import { Suspense } from "react";
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
import {
  toStudyDeckOptions,
  toStudyTagOptions,
  toStudyUiCopy,
} from "@/features/study/lib/study-ui-copy";
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

/** Quiet placeholder while due cards + habit stream in. */
function StudyFallback() {
  return (
    <div className="study study--fallback" aria-busy="true">
      <div className="study-stage">
        <span className="study-stage__filters">…</span>
        <p className="study-stage__meta">…</p>
      </div>
      <div className="study-board">
        <article className="flashcard">
          <p className="flashcard__lang">…</p>
          <h1 className="flashcard__front">&nbsp;</h1>
        </article>
      </div>
    </div>
  );
}

/** Fetches session data — streamed behind Suspense so the shell can paint. */
async function StudySessionLoader({
  lang,
  searchParams,
}: {
  lang: string;
  searchParams: StudyPageProps["searchParams"];
}) {
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
    <StudySession
      // Soft-switch keeps this mounted; no key={deck} remount.
      initialCards={cards}
      direction={direction}
      practiceAll={practiceAll}
      deckSlug={deckSlug}
      decks={toStudyDeckOptions(dict.study, decks)}
      tagOptions={toStudyTagOptions(dict.study, deckTags)}
      tag={tag}
      stage={stage}
      locale={lang}
      dict={toStudyUiCopy(dict.study)}
      habit={habit}
    />
  );
}

export default async function StudyPage({
  params,
  searchParams,
}: StudyPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  return (
    <main className="app-main app-main--study">
      <Suspense fallback={<StudyFallback />}>
        <StudySessionLoader lang={lang} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
