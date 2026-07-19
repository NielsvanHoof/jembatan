import { describe, expect, it } from "vitest";
import { pickSessionCards } from "@/features/study/lib/pick-session-cards";
import { NEW_CARD_LIMIT, SESSION_CARD_LIMIT } from "@/lib/habit";

function row(id: string, seen: boolean) {
  return {
    id,
    progress: { lastReviewedAt: seen ? new Date() : null },
  };
}

describe("pickSessionCards", () => {
  it("prefers seen cards before fresh ones", () => {
    const rows = [
      row("fresh-1", false),
      row("seen-1", true),
      row("fresh-2", false),
      row("seen-2", true),
    ];
    const picked = pickSessionCards(rows);
    expect(picked.map((r) => r.id)).toEqual([
      "seen-1",
      "seen-2",
      "fresh-1",
      "fresh-2",
    ]);
  });

  it("caps total session size and new-card introductions", () => {
    const seen = Array.from({ length: SESSION_CARD_LIMIT + 5 }, (_, i) =>
      row(`seen-${i}`, true),
    );
    const fresh = Array.from({ length: NEW_CARD_LIMIT + 5 }, (_, i) =>
      row(`fresh-${i}`, false),
    );
    const picked = pickSessionCards([...fresh, ...seen]);
    expect(picked).toHaveLength(SESSION_CARD_LIMIT);
    expect(picked.every((r) => r.id.startsWith("seen-"))).toBe(true);

    const mostlyFresh = pickSessionCards(fresh);
    expect(mostlyFresh).toHaveLength(NEW_CARD_LIMIT);
  });
});
