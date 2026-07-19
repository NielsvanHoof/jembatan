import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * Require a logged-in user; throw if the session is missing.
 * React.cache: study load runs getDueCards + getHabitSummary in parallel —
 * both call this; one auth lookup per request is enough.
 */
export const requireUserId = cache(async (): Promise<string> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
});
