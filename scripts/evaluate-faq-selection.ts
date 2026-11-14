import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import "dotenv/config";

import { selectFaq } from "../lib/faq-selection/select.js";
import type { FaqSelection } from "../lib/faq-selection/schema.js";
import { createOpenAIClient, getOpenAIModel } from "../lib/llm/client.js";

type EvaluationCase = Readonly<{
  id: string;
  query: string;
  expected:
    | Readonly<{ kind: "match"; articleIds: readonly string[] }>
    | Readonly<{ kind: "no_match" }>;
}>;

type EvaluationResult = Readonly<{
  id: string;
  query: string;
  expected: EvaluationCase["expected"];
  actual: FaqSelection;
  passed: boolean;
  reason: string;
}>;

const CASES_PATH = resolve(
  process.cwd(),
  "scripts/fixtures/faq-evaluation-cases.json",
);
const REPORT_PATH = resolve(
  process.cwd(),
  "artifacts/faq-evaluation/latest.json",
);

async function main(): Promise<void> {
  const cases = await loadEvaluationCases();
  const client = createOpenAIClient();
  const model = getOpenAIModel();
  const results: EvaluationResult[] = [];

  for (const evaluationCase of cases) {
    const actual = await selectFaq(evaluationCase.query, { client, model });
    const evaluation = evaluate(evaluationCase, actual);
    results.push({ ...evaluationCase, actual, ...evaluation });
  }

  const passed = results.filter((result) => result.passed).length;
  const report = {
    generatedAt: new Date().toISOString(),
    model,
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
    },
    results,
  };

  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"} ${result.id}: ${result.reason}`);
  }
  console.log(`Report: ${REPORT_PATH}`);

  if (report.summary.failed > 0) {
    process.exitCode = 1;
  }
}

async function loadEvaluationCases(): Promise<readonly EvaluationCase[]> {
  const source = await readFile(CASES_PATH, "utf8");
  return JSON.parse(source) as EvaluationCase[];
}

function evaluate(
  evaluationCase: EvaluationCase,
  actual: FaqSelection,
): Pick<EvaluationResult, "passed" | "reason"> {
  if (actual.kind !== evaluationCase.expected.kind) {
    return {
      passed: false,
      reason: `expected ${evaluationCase.expected.kind}, received ${actual.kind}`,
    };
  }

  if (evaluationCase.expected.kind === "match") {
    const expectedIds = [...evaluationCase.expected.articleIds].sort();
    const actualIds = [...actual.articleIds].sort();

    if (expectedIds.join(",") !== actualIds.join(",")) {
      return {
        passed: false,
        reason: `expected IDs ${expectedIds.join(", ")}, received ${actualIds.join(", ")}`,
      };
    }
  }

  return { passed: true, reason: "matched expectation" };
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
