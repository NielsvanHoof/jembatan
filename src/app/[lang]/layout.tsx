import type { Metadata, Viewport } from "next";
import { Figtree, Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { PwaRegister } from "@/components/pwa-register";
import {
  getDictionary,
  isLocale,
  type Locale,
  locales,
} from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";
import { localeAlternates, openGraphLocale, SITE_URL } from "@/lib/seo";
import "../globals.css";

/** Phone-first viewport — safe-area for notched devices. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b3a4b",
};

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type LangLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

/**
 * Default site-wide metadata. Child pages override title/description via
 * buildPageMetadata; the title template fills in "%s · Jembatan".
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    return {};
  }
  const dict = getDictionary(lang);

  return {
    metadataBase: new URL(SITE_URL),
    // Absolute default so the landing title is not double-templated.
    title: {
      default: dict.meta.title,
      template: "%s · Jembatan",
    },
    description: dict.meta.description,
    applicationName: "Jembatan",
    alternates: localeAlternates(lang, "/"),
    openGraph: {
      type: "website",
      siteName: "Jembatan",
      title: dict.meta.title,
      description: dict.meta.description,
      url: pathFor(lang, "/"),
      locale: openGraphLocale(lang),
      alternateLocale: locales.filter((l) => l !== lang).map(openGraphLocale),
      // Image comes from app/[lang]/opengraph-image.tsx (bridge motif).
    },
    twitter: {
      // Large card uses app/[lang]/twitter-image.tsx (same bridge art).
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Jembatan",
    },
    icons: {
      apple: "/icons/apple-touch-icon.png",
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: LangLayoutProps) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  const locale: Locale = lang;

  return (
    <html
      lang={locale}
      className={`${instrument.variable} ${figtree.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        {children}
        <PwaRegister locale={locale} />
      </body>
    </html>
  );
}
