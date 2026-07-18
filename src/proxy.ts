import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { DEFAULT_LOCALE } from "@/lib/i18n/dictionaries";
import {
  getLocaleFromPathname,
  negotiateLocale,
  pathFor,
  pathnameHasLocale,
  stripLocalePrefix,
} from "@/lib/i18n/paths";

const { auth } = NextAuth(authConfig);

/** Old Indonesian route segments → English (bookmarks / shared links). */
const LEGACY_PATHS: Record<string, string> = {
  "/belajar": "/study",
  "/kemajuan": "/progress",
  "/masuk": "/login",
  "/daftar": "/register",
};

/**
 * 1) Ensure every page URL has /id or /en (Next.js i18n routing).
 * 2) Protect study routes and bounce auth pages when already signed in.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip API / Next internals (matcher also filters, this is a safety net).
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Prefix missing locale using Accept-Language (default: id).
  if (!pathnameHasLocale(pathname)) {
    const locale = negotiateLocale(req.headers.get("accept-language"));
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE;
  const barePath = stripLocalePrefix(pathname);
  const isLoggedIn = !!req.auth;

  // Redirect legacy Indonesian path names to English.
  for (const [legacy, next] of Object.entries(LEGACY_PATHS)) {
    if (barePath === legacy || barePath.startsWith(`${legacy}/`)) {
      const suffix = barePath.slice(legacy.length);
      const url = req.nextUrl.clone();
      url.pathname = pathFor(locale, `${next}${suffix}`);
      return NextResponse.redirect(url);
    }
  }

  if (
    !isLoggedIn &&
    (barePath.startsWith("/study") ||
      barePath.startsWith("/progress") ||
      barePath.startsWith("/offline"))
  ) {
    const loginUrl = new URL(pathFor(locale, "/login"), req.nextUrl.origin);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && (barePath === "/login" || barePath === "/register")) {
    return NextResponse.redirect(
      new URL(pathFor(locale, "/study"), req.nextUrl.origin),
    );
  }

  return NextResponse.next();
});

export const config = {
  // Run on all page routes; skip Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
