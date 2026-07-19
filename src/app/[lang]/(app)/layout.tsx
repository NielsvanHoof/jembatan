import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";

type AppLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

/**
 * Shared shell for study / progress / offline.
 * AppNav mounts once here so tab switches keep the header (no chrome flash).
 */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const dict = getDictionary(lang);

  return (
    <div className="app-shell">
      <AppNav locale={lang} dict={dict} />
      {children}
    </div>
  );
}
