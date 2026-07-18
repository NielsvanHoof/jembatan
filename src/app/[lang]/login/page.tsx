import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";

type LoginPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const dict = getDictionary(lang);

  return (
    <div className="app-shell">
      <AppNav locale={lang} dict={dict} />
      <main className="app-main auth-page">
        <h1>{dict.login.title}</h1>
        <p className="lede">{dict.login.lede}</p>
        <AuthForm mode="login" locale={lang} dict={dict.auth} />
      </main>
    </div>
  );
}
