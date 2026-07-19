import { describe, expect, it } from "vitest";
import { resolveStudyFilters } from "@/features/study/lib/resolve-study-filters";

const base = {
  deckSlug: "core",
  direction: "id_to_nl" as const,
  tag: undefined as string | undefined,
  stage: undefined as "words" | "sentences" | undefined,
  practiceAll: false,
};

describe("resolveStudyFilters", () => {
  it("marks unchanged when patch is empty", () => {
    const resolved = resolveStudyFilters(base, {});
    expect(resolved.unchanged).toBe(true);
    expect(resolved.deckSlug).toBe("core");
  });

  it("clears theme and stage when deck changes", () => {
    const resolved = resolveStudyFilters(
      { ...base, tag: "makanan", stage: "words" },
      { deckSlug: "outing" },
    );
    expect(resolved.deckSlug).toBe("outing");
    expect(resolved.tag).toBeUndefined();
    expect(resolved.stage).toBeUndefined();
    expect(resolved.unchanged).toBe(false);
  });

  it("resets outing theme switches to words", () => {
    const resolved = resolveStudyFilters(
      { ...base, deckSlug: "outing", tag: "ov", stage: "sentences" },
      { tag: "cafe" },
    );
    expect(resolved.tag).toBe("cafe");
    expect(resolved.stage).toBe("words");
  });

  it("keeps explicit stage on outing themes", () => {
    const resolved = resolveStudyFilters(
      { ...base, deckSlug: "outing", tag: "ov", stage: "words" },
      { stage: "sentences" },
    );
    expect(resolved.stage).toBe("sentences");
    expect(resolved.tag).toBe("ov");
  });

  it("clears theme when tag is null", () => {
    const resolved = resolveStudyFilters(
      { ...base, tag: "ov", stage: "words" },
      { tag: null },
    );
    expect(resolved.tag).toBeUndefined();
    expect(resolved.stage).toBeUndefined();
  });

  it("drops stage for non-outing tags", () => {
    const resolved = resolveStudyFilters(base, { tag: "makanan" });
    expect(resolved.tag).toBe("makanan");
    expect(resolved.stage).toBeUndefined();
  });
});
