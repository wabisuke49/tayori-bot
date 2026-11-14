import OpenAI from "openai";

export class OpenAIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIConfigurationError";
  }
}

export function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new OpenAIConfigurationError(
      "OPENAI_API_KEY must be set before selecting a FAQ article.",
    );
  }

  return new OpenAI({ apiKey });
}

export function getOpenAIModel(): string {
  const model = process.env.OPENAI_MODEL;

  if (!model) {
    throw new OpenAIConfigurationError(
      "OPENAI_MODEL must be set before selecting a FAQ article.",
    );
  }

  return model;
}
