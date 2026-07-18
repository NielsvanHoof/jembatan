import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgressStats } from "@/app/actions/study";
import { AppNav } from "@/components/app-nav";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

type KemajuanPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function KemajuanPage({ params }: KemajuanPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const dict = getDictionary(lang);
  const stats = await getProgressStats();

  return (
    <div className="app-shell">
      <AppNav locale={lang} dict={dict} active="progress" />
      <main className="app-main progress-page">
        <h1>{dict.progress.title}</h1>
        <p className="lede">{dict.progress.lede}</p>

        <ul className="stat-list">
          <li>
            <span className="stat-list__label">{dict.progress.dueNow}</span>
            <span className="stat-list__value">{stats.dueNow}</span>
          </li>
          <li>
            <span className="stat-list__label">
              {dict.progress.reviewedToday}
            </span>
            <span className="stat-list__value">{stats.reviewedToday}</span>
          </li>
          <li>
            <span className="stat-list__label">{dict.progress.learning}</span>
            <span className="stat-list__value">{stats.learning}</span>
          </li>
          <li>
            <span className="stat-list__label">{dict.progress.mastered}</span>
            <span className="stat-list__value">{stats.mastered}</span>
          </li>
          <li>
            <span className="stat-list__label">{dict.progress.totalCards}</span>
            <span className="stat-list__value">{stats.totalCards}</span>
          </li>
        </ul>

        <div className="progress-cta">
          <Link href={pathFor(lang, "/study")} className="btn btn--primary">
            {dict.progress.startSession}
          </Link>
        </div>
      </main>
    </div>
  );
}
