import type { FaqArticle } from "../faq/types.js";

export type FaqSearchMatch = Readonly<{
  kind: "match";
  articles: readonly FaqArticle[];
}>;

export type FaqSearchNoMatch = Readonly<{
  kind: "no_match";
  articles: readonly [];
}>;

export type FaqSearchError = Readonly<{
  kind: "error";
  articles: readonly [];
}>;

export type FaqSearchResult =
  | FaqSearchMatch
  | FaqSearchNoMatch
  | FaqSearchError;
