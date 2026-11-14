import {
  getFaqArticleById,
} from "../faq/registry.js";
import type { FaqArticle } from "../faq/types.js";
import { selectFaq } from "../faq-selection/select.js";
import type { FaqSelection } from "../faq-selection/schema.js";
import type { FaqSearchResult } from "./types.js";

type FaqSelector = (query: string) => Promise<FaqSelection>;

type SearchFaqOptions = Readonly<{
  select?: FaqSelector;
}>;

const EMPTY_ARTICLES = [] as const;

export async function searchFaq(
  query: string,
  options: SearchFaqOptions = {},
): Promise<FaqSearchResult> {
  try {
    const selection = await (options.select ?? selectFaq)(query);

    if (selection.kind === "match") {
      const articles = findSelectedArticles(selection.articleIds);

      return articles.length > 0
        ? { kind: "match", articles }
        : { kind: "no_match", articles: EMPTY_ARTICLES };
    }

    return { kind: "no_match", articles: EMPTY_ARTICLES };
  } catch {
    return { kind: "error", articles: EMPTY_ARTICLES };
  }
}

function findSelectedArticles(articleIds: readonly string[]): readonly FaqArticle[] {
  return [...new Set(articleIds)]
    .slice(0, 3)
    .flatMap((articleId) => {
      const article = getFaqArticleById(articleId);
      return article ? [article] : [];
    });
}
