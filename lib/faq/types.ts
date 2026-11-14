export type FaqArticle = Readonly<{
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
}>;

export type FaqRegistry = Readonly<{
  source_url: string;
  checked_on: string;
  article_count: number;
  note: string;
  articles: readonly FaqArticle[];
}>;
