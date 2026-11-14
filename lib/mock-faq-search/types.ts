import type { FaqSearchMatch } from "../faq-search/types.js";

export type MockFaqSearchRequest = Readonly<{
  query: string;
}>;

export type MockFaqSearchResponse = FaqSearchMatch;
