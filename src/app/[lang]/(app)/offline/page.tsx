import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfflineStudy } from "@/features/study/components/offline-study";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/seo";

type OfflinePageProps = {
  params: Promise<{ lang: string }>;
};

/** PWA fallback — not meant for search results. */
export async function generateMetadata({
  params,
}: OfflinePageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    return {};
  }
  const dict = getDictionary(lang);
  return buildPageMetadata({
    locale: lang,
    path: "/offline",
    title: dict.meta.pages.offline,
    description: dict.offline.emptyBody,
    robots: { index: false, follow: false },
  });
}

/** Fallback route served by the service worker when offline. */
export default async function OfflinePage({ params }: OfflinePageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const dict = getDictionary(lang);

  return (
    <main className="app-main app-main--study">
      <OfflineStudy locale={lang} dict={dict} />
    </main>
  );
}
