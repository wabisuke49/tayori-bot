import registryData from "../../data/cuculu_faq_registry.json";

import type { FaqArticle, FaqRegistry } from "./types.js";

export const faqRegistry: FaqRegistry = registryData;

export function getFaqArticles(): readonly FaqArticle[] {
  return faqRegistry.articles;
}

export function getFaqArticleById(
  articleId: string,
): FaqArticle | undefined {
  return faqRegistry.articles.find((article) => article.id === articleId);
}
