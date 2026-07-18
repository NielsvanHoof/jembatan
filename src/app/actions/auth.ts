"use server";

import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, signIn, signOut } from "@/lib/auth";
import {
  type AuthErrorCode,
  DEFAULT_LOCALE,
  isLocale,
} from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(100),
  locale: z.string().optional(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
  locale: z.string().optional(),
});

export type AuthFormState = {
  /** Stable code — UI translates based on current locale */
  error?: AuthErrorCode;
  success?: boolean;
};

function localeFromForm(value: string | undefined) {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "invalid_input" };
  }

  const locale = localeFromForm(parsed.data.locale);
  const email = parsed.data.email.toLowerCase().trim();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing[0]) {
    return { error: "email_taken" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.insert(users).values({
    email,
    passwordHash,
    name: parsed.data.name.trim(),
  });

  // Auto sign-in after register so she lands in the study flow quickly.
  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: pathFor(locale, "/belajar"),
    });
  } catch (error) {
    // NextAuth throws a redirect on success — rethrow those.
    if (error instanceof AuthError) {
      return { error: "register_signin_failed" };
    }
    throw error;
  }

  return { success: true };
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "invalid_credentials_format" };
  }

  const locale = localeFromForm(parsed.data.locale);

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase().trim(),
      password: parsed.data.password,
      redirectTo: pathFor(locale, "/belajar"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "wrong_credentials" };
    }
    throw error;
  }

  return { success: true };
}

export async function logoutAction(formData: FormData) {
  const locale = localeFromForm(
    typeof formData.get("locale") === "string"
      ? String(formData.get("locale"))
      : undefined,
  );
  await signOut({ redirectTo: pathFor(locale) });
}
