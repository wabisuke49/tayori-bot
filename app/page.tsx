"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

type FaqSearchResult =
  | Readonly<{
      kind: "match";
      articles: readonly Readonly<{
        id: string;
        title: string;
        category: string;
        description: string;
        url: string;
      }>[];
    }>
  | Readonly<{
      kind: "no_match";
      articles: readonly [];
    }>;

type ApiError = Readonly<{
  error: string;
}>;

export default function Home(): ReactNode {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<FaqSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!query.trim()) {
      setError("検索内容を入力してください。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const payload: unknown = await response.json();

      if (!response.ok || isApiError(payload)) {
        throw new Error("FAQ の検索に失敗しました。");
      }

      setResult(payload as FaqSearchResult);
    } catch {
      setError("FAQ の検索に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <h1>Tayori FAQ 検索</h1>
      お困りごとを入力してください。
      <form onSubmit={handleSubmit} aria-busy={isLoading}>
        {/* <label htmlFor="query">お困りごとを入力してください</label> */}
        <textarea
          id="query"
          name="query"
          aria-label="お困りごとを入力してください"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="例: テレビにE202エラーが出て映りません"
          rows={3}
          cols={100}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "検索中..." : "検索"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}
      <SearchResult result={result} />
    </main>
  );
}

function SearchResult({
  result,
}: Readonly<{ result: FaqSearchResult | null }>): ReactNode {
  if (!result) {
    return null;
  }

  if (result.kind === "match") {
    return (
      <section aria-live="polite">
        <h2>関連する TayoriFAQ</h2>
        <ul>
          {result.articles.map((article) => (
            <li key={article.url}>
              <p>{article.title}</p>
              <p>
                <a href={article.url} target="_blank" rel="noreferrer">
                  {article.url}
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section aria-live="polite">
      <h2>該当する FAQ を特定できませんでした</h2>
    </section>
  );
}

function isApiError(payload: unknown): payload is ApiError {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  );
}
