import { describe, expect, it } from "vitest";
import { studyHref } from "@/features/study/lib/study-url";

describe("studyHref", () => {
  it("includes deck and direction", () => {
    const href = studyHref("en", {
      deckSlug: "core",
      direction: "id_to_nl",
    });
    expect(href).toContain("/en/study?");
    expect(href).toContain("deck=core");
    expect(href).toContain("direction=id_to_nl");
    expect(href).not.toContain("practice=");
  });

  it("adds practice, tag, and stage when set", () => {
    const href = studyHref("id", {
      deckSlug: "outing",
      direction: "nl_to_id",
      practiceAll: true,
      tag: "ov",
      stage: "sentences",
    });
    expect(href).toContain("/id/study?");
    expect(href).toContain("practice=1");
    expect(href).toContain("tag=ov");
    expect(href).toContain("stage=sentences");
  });

  it("omits stage when there is no tag", () => {
    const href = studyHref("en", {
      deckSlug: "core",
      direction: "id_to_nl",
      stage: "words",
    });
    expect(href).not.toContain("stage=");
  });
});
