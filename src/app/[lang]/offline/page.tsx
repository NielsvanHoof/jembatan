import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { OfflineStudy } from "@/features/study/components/offline-study";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";

type OfflinePageProps = {
  params: Promise<{ lang: string }>;
};

/** Fallback route served by the service worker when offline. */
export default async function OfflinePage({ params }: OfflinePageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const dict = getDictionary(lang);

  return (
    <div className="app-shell app-shell--study">
      <AppNav locale={lang} dict={dict} active="study" />
      <main className="app-main app-main--study">
        <OfflineStudy locale={lang} dict={dict} />
      </main>
    </div>
  );
}
