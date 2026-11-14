import { zodTextFormat } from "openai/helpers/zod";
import type OpenAI from "openai";

import { getFaqArticles } from "../faq/registry.js";
import {
  createOpenAIClient,
  getOpenAIModel,
} from "../llm/client.js";
import { buildFaqSelectionSystemPrompt } from "./prompt.js";
import { faqSelectionSchema, type FaqSelection } from "./schema.js";

export class FaqSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FaqSelectionError";
  }
}

type SelectFaqOptions = Readonly<{
  client?: OpenAI;
  model?: string;
}>;

export async function selectFaq(
  query: string,
  options: SelectFaqOptions = {},
): Promise<FaqSelection> {
  const response = await (options.client ?? createOpenAIClient()).responses.parse({
    model: options.model ?? getOpenAIModel(),
    input: [
      {
        role: "system",
        content: buildFaqSelectionSystemPrompt(getFaqArticles()),
      },
      { role: "user", content: query },
    ],
    text: {
      format: zodTextFormat(faqSelectionSchema, "faq_selection"),
    },
  });

  if (!response.output_parsed) {
    throw new FaqSelectionError(
      "The model did not return a structured FAQ selection.",
    );
  }

  return response.output_parsed;
}
