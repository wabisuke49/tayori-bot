import { searchFaq } from "../../../lib/faq-search/search-faq.js";

type SearchRequest = Readonly<{
  query?: unknown;
}>;

export async function POST(request: Request): Promise<Response> {
  const body = await parseRequestBody(request);

  if (!body || typeof body.query !== "string" || !body.query.trim()) {
    return Response.json(
      { error: "query must be a non-empty string." },
      { status: 400 },
    );
  }

  const result = await searchFaq(body.query.trim());

  if (result.kind === "error") {
    return Response.json(
      { error: "FAQ search failed." },
      { status: 500 },
    );
  }

  return Response.json(result);
}

async function parseRequestBody(request: Request): Promise<SearchRequest | null> {
  try {
    return (await request.json()) as SearchRequest;
  } catch {
    return null;
  }
}
