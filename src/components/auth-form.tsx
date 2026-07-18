"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  type AuthFormState,
  loginAction,
  registerAction,
} from "@/app/actions/auth";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/paths";

const initial: AuthFormState = {};

type AuthFormProps = {
  mode: "login" | "register";
  locale: Locale;
  dict: Dictionary["auth"];
};

/** Shared login / register form with localized chrome. */
export function AuthForm({ mode, locale, dict }: AuthFormProps) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="locale" value={locale} />

      {mode === "register" ? (
        <label className="field">
          <span>{dict.name}</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder={dict.namePlaceholder}
          />
        </label>
      ) : null}

      <label className="field">
        <span>{dict.email}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={dict.emailPlaceholder}
        />
      </label>

      <label className="field">
        <span>{dict.password}</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          placeholder={dict.passwordPlaceholder}
        />
      </label>

      {state.error ? (
        <p className="form-error" role="alert">
          {dict.errors[state.error]}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn btn--primary btn--wide"
        disabled={pending}
      >
        {pending
          ? dict.pending
          : mode === "login"
            ? dict.submitLogin
            : dict.submitRegister}
      </button>

      <p className="auth-form__switch">
        {mode === "login" ? (
          <>
            {dict.noAccount}{" "}
            <Link href={pathFor(locale, "/daftar")}>{dict.registerLink}</Link>
          </>
        ) : (
          <>
            {dict.hasAccount}{" "}
            <Link href={pathFor(locale, "/masuk")}>{dict.loginLink}</Link>
          </>
        )}
      </p>
    </form>
  );
}
