import type {
  MockFaqSearchRequest,
  MockFaqSearchResponse,
} from "../../../lib/mock-faq-search/types.js";

const MOCK_FAQ_SEARCH_RESPONSE: MockFaqSearchResponse = {
  kind: "match",
  articles: [
    {
      id: "faq_1068272",
      title: "リネン回収BOXがいっぱいになった(雨の日)",
      category: "リネン",
      description:
        "雨の日にリネン回収ボックスが満杯になり、濡れないように置く方法を確認したいとき。",
      url: "https://tayori.com/q/cuculu-cleaning/detail/1068272/",
    },
  ],
};

export async function POST(request: Request): Promise<Response> {
  const body = await parseRequestBody(request);

  if (!body || !body.query.trim()) {
    return Response.json(
      { error: "query must be a non-empty string." },
      { status: 400 },
    );
  }

  return Response.json(MOCK_FAQ_SEARCH_RESPONSE);
}

async function parseRequestBody(
  request: Request,
): Promise<MockFaqSearchRequest | null> {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("query" in body) ||
      typeof body.query !== "string"
    ) {
      return null;
    }

    return { query: body.query };
  } catch {
    return null;
  }
}
