/**
 * Pre-generate Chirp 3 HD MP3s for every deck phrase.
 * Run: npm run audio:generate
 *
 * Auth: Application Default Credentials, or set
 * GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path.
 * Enable the Cloud Text-to-Speech API on the GCP project first.
 */
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { parse as parseYaml } from "yaml";
import "./load-env";
import {
  type AudioLocale,
  audioPublicRelativePath,
  normalizeAudioText,
} from "../src/features/study/lib/card-audio-path";

/** Fixed Chirp 3 HD speaker — same character in both study languages. */
const CHIRP_VOICE = "Kore";

type DeckCard = {
  frontId: string;
  backNl: string;
  exampleId?: string;
  exampleNl?: string;
};

type DeckFile = {
  cards: DeckCard[];
};

type PhraseJob = {
  locale: AudioLocale;
  languageCode: "id-ID" | "nl-NL";
  text: string;
};

const DECKS_DIR = path.join(process.cwd(), "content/decks");
const PUBLIC_DIR = path.join(process.cwd(), "public");

async function loadDeckCards(): Promise<DeckCard[]> {
  const names = (await readdir(DECKS_DIR))
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .sort();
  const cards: DeckCard[] = [];
  for (const name of names) {
    const raw = await readFile(path.join(DECKS_DIR, name), "utf8");
    const deck = parseYaml(raw) as DeckFile;
    cards.push(...(deck.cards ?? []));
  }
  return cards;
}

/** Collect unique (locale, text) jobs from card fields. */
function collectJobs(cards: DeckCard[]): PhraseJob[] {
  const seen = new Set<string>();
  const jobs: PhraseJob[] = [];

  const add = (
    locale: AudioLocale,
    languageCode: "id-ID" | "nl-NL",
    text: string | undefined,
  ) => {
    if (!text?.trim()) {
      return;
    }
    // Same normalization as the path helper / study UI.
    const normalized = normalizeAudioText(text);
    const key = `${locale}\0${normalized}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    jobs.push({ locale, languageCode, text: normalized });
  };

  for (const card of cards) {
    add("id", "id-ID", card.frontId);
    add("nl", "nl-NL", card.backNl);
    add("id", "id-ID", card.exampleId);
    add("nl", "nl-NL", card.exampleNl);
  }

  return jobs;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const cards = await loadDeckCards();
  const jobs = collectJobs(cards);
  const client = new TextToSpeechClient();

  let created = 0;
  let skipped = 0;

  console.log(`Generating Chirp 3 HD audio for ${jobs.length} unique phrases…`);

  for (const job of jobs) {
    const relative = await audioPublicRelativePath(job.locale, job.text);
    const outPath = path.join(PUBLIC_DIR, relative);
    await mkdir(path.dirname(outPath), { recursive: true });

    if (await fileExists(outPath)) {
      skipped += 1;
      continue;
    }

    const voiceName = `${job.languageCode}-Chirp3-HD-${CHIRP_VOICE}`;
    const [response] = await client.synthesizeSpeech({
      input: { text: job.text },
      voice: {
        languageCode: job.languageCode,
        name: voiceName,
      },
      audioConfig: { audioEncoding: "MP3" },
    });

    if (!response.audioContent) {
      throw new Error(`Empty audio for ${voiceName}: ${job.text}`);
    }

    const bytes =
      typeof response.audioContent === "string"
        ? Buffer.from(response.audioContent, "base64")
        : Buffer.from(response.audioContent);

    await writeFile(outPath, bytes);
    created += 1;
    console.log(`  + ${relative}`);
  }

  console.log(`Done. created=${created} skipped=${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
