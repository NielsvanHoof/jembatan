import { describe, expect, it } from "vitest";
import {
  applyLocalQueue,
  directionShort,
  formatNextDue,
} from "@/features/study/lib/study-queue";
import type { StudyUiCopy } from "@/features/study/lib/study-ui-copy";
import type { StudyCard } from "@/features/study/types";

function card(id: string): StudyCard {
  return {
    cardId: id,
    progressId: `p-${id}`,
    front: `front-${id}`,
    back: `back-${id}`,
    direction: "id_to_nl",
    tags: [],
    stage: "words",
  };
}

const dict = {
  emptyNextDue: "Next: {when}",
  nextDueSoon: "soon",
  nextDueHours: "{n}h",
  nextDueDays: "{n}d",
} as StudyUiCopy;

describe("applyLocalQueue", () => {
  const a = card("a");
  const b = card("b");
  const c = card("c");

  it("drops the current card for hard/good/easy", () => {
    expect(applyLocalQueue([a, b, c], a, "good")).toEqual([b, c]);
    expect(applyLocalQueue([a, b], a, "easy")).toEqual([b]);
  });

  it("requeues again to the end", () => {
    expect(applyLocalQueue([a, b, c], a, "again")).toEqual([b, c, a]);
  });
});

describe("directionShort", () => {
  it("labels both directions", () => {
    expect(directionShort("id_to_nl")).toBe("ID → NL");
    expect(directionShort("nl_to_id")).toBe("NL → ID");
  });
});

describe("formatNextDue", () => {
  it("returns null when there is no next due", () => {
    expect(formatNextDue(dict, null)).toBeNull();
  });

  it("uses soon copy for due-now or within an hour", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(formatNextDue(dict, past)).toBe("Next: soon");
  });

  it("formats hours and days buckets", () => {
    const inThreeHours = new Date(
      Date.now() + 3 * 60 * 60 * 1000,
    ).toISOString();
    const inTwoDays = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatNextDue(dict, inThreeHours)).toBe("Next: 3h");
    expect(formatNextDue(dict, inTwoDays)).toBe("Next: 2d");
  });
});
