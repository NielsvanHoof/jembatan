import { describe, expect, it } from "vitest";
import {
  answerAudioLocale,
  audioFileHash,
  audioPath,
  audioPublicRelativePath,
  normalizeAudioText,
  promptAudioLocale,
} from "@/features/study/lib/card-audio-path";

describe("normalizeAudioText", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeAudioText("  Hoeveel   kost het?  ")).toBe(
      "Hoeveel kost het?",
    );
  });
});

describe("audioFileHash / audioPath", () => {
  it("hashes a fixed phrase to a stable SHA-1", async () => {
    // SHA-1("Terima kasih") — lock the contract between script and UI.
    await expect(audioFileHash("Terima kasih")).resolves.toBe(
      "cd1f655aa012999bcc257a041feff1ed53570fc5",
    );
  });

  it("builds public and relative paths from the same hash", async () => {
    const hash = await audioFileHash("Dank je wel");
    await expect(audioPath("nl", "Dank je wel")).resolves.toBe(
      `/audio/nl/${hash}.mp3`,
    );
    await expect(audioPublicRelativePath("nl", "Dank je wel")).resolves.toBe(
      `audio/nl/${hash}.mp3`,
    );
  });

  it("normalizes before hashing so padding does not change the path", async () => {
    const a = await audioPath("id", "Permisi");
    const b = await audioPath("id", "  Permisi  ");
    expect(a).toBe(b);
  });
});

describe("promptAudioLocale / answerAudioLocale", () => {
  it("maps study direction to speak locales", () => {
    expect(promptAudioLocale("id_to_nl")).toBe("id");
    expect(answerAudioLocale("id_to_nl")).toBe("nl");
    expect(promptAudioLocale("nl_to_id")).toBe("nl");
    expect(answerAudioLocale("nl_to_id")).toBe("id");
  });
});
