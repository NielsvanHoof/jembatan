import type { NextAuthConfig } from "next-auth";
import { DEFAULT_LOCALE } from "@/lib/i18n/dictionaries";
import { pathFor, stripLocalePrefix } from "@/lib/i18n/paths";

/**
 * Edge-safe Auth.js config (no DB / bcrypt).
 * Used by proxy; full providers live in auth.ts.
 */
export const authConfig = {
  // Required in production / Vercel — see .env.example (AUTH_SECRET).
  secret: process.env.AUTH_SECRET,
  pages: {
    // Fallback when Auth.js itself redirects; proxy uses the active locale.
    signIn: pathFor(DEFAULT_LOCALE, "/login"),
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const bare = stripLocalePrefix(request.nextUrl.pathname);
      const isProtected =
        bare.startsWith("/study") || bare.startsWith("/progress");
      if (isProtected) {
        return !!auth?.user;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
