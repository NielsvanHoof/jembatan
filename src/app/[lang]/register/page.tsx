import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/seo";

type RegisterPageProps = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({
  params,
}: RegisterPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    return {};
  }
  const dict = getDictionary(lang);
  return buildPageMetadata({
    locale: lang,
    path: "/register",
    title: dict.meta.pages.register,
    description: dict.register.lede,
  });
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const dict = getDictionary(lang);

  return (
    <div className="app-shell">
      <AppNav locale={lang} dict={dict} />
      <main className="app-main auth-page">
        <h1>{dict.register.title}</h1>
        <p className="lede">{dict.register.lede}</p>
        <AuthForm mode="register" locale={lang} dict={dict.auth} />
      </main>
    </div>
  );
}
