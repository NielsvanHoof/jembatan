import { notFound } from "next/navigation";
import { getDueCards, parseDirection } from "@/app/actions/study";
import { AppNav } from "@/components/app-nav";
import { StudySession } from "@/components/study-session";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";

type BelajarPageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ arah?: string; latihan?: string }>;
};

export default async function BelajarPage({
  params,
  searchParams,
}: BelajarPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const query = await searchParams;
  const direction = await parseDirection(query.arah);
  const practiceAll = query.latihan === "1";
  const dict = getDictionary(lang);
  const cards = await getDueCards(direction, { practiceAll });

  return (
    <div className="app-shell app-shell--study">
      <AppNav locale={lang} dict={dict} active="study" />
      <main className="app-main app-main--study">
        <StudySession
          key={`${direction}-${practiceAll ? "all" : "due"}`}
          initialCards={cards}
          direction={direction}
          practiceAll={practiceAll}
          locale={lang}
          dict={dict.study}
        />
      </main>
    </div>
  );
}
