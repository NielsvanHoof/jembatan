import { auth } from "@/lib/auth";

/** Require a logged-in user; throw if the session is missing. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}
