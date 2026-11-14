import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import "dotenv/config";

import { searchFaq } from "../lib/faq-search/search-faq.js";
import type { FaqSearchResult } from "../lib/faq-search/types.js";

type RepresentativeQuestion = Readonly<{
  id: number;
  text: string;
  category: string;
}>;

type VerificationResult = Readonly<{
  id: number;
  text: string;
  category: string;
  result: FaqSearchResult;
}>;

const INPUT_PATH = resolve(
  process.cwd(),
  "scripts/fixtures/line-message-representative-questions-20260215-20261103.json",
);
const OUTPUT_PATH = resolve(
  process.cwd(),
  "tmp/line-message-representative-questions-20260215-20261103-search-results.json",
);

async function main(): Promise<void> {
  const questions = await loadQuestions();
  const results: VerificationResult[] = [];

  for (const question of questions) {
    const result = await searchFaq(question.text);
    results.push({ ...question, result });
    console.log(`${question.id}: ${result.kind}`);
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

async function loadQuestions(): Promise<readonly RepresentativeQuestion[]> {
  const source = await readFile(INPUT_PATH, "utf8");
  const parsed: unknown = JSON.parse(source);

  if (!Array.isArray(parsed) || !parsed.every(isRepresentativeQuestion)) {
    throw new Error("Input fixture contains an invalid question.");
  }

  const ids = new Set<number>();
  for (const question of parsed) {
    if (ids.has(question.id)) {
      throw new Error(`Input fixture contains a duplicate ID: ${question.id}`);
    }
    ids.add(question.id);
  }

  return parsed;
}

function isRepresentativeQuestion(value: unknown): value is RepresentativeQuestion {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    Number.isInteger(value.id) &&
    "text" in value &&
    typeof value.text === "string" &&
    value.text.trim() !== "" &&
    "category" in value &&
    typeof value.category === "string" &&
    value.category.trim() !== ""
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
