/**
 * Auth domain types (form state / DTOs).
 * Kept separate from actions so UI can import types without pulling server code.
 */

import type { AuthErrorCode } from "@/lib/i18n/dictionaries";

/** Result shape for login / register server actions. */
export type AuthFormState = {
  /** Stable code — UI translates based on current locale */
  error?: AuthErrorCode;
  success?: boolean;
};

/** Which auth screen the shared form is rendering. */
export type AuthFormMode = "login" | "register";
