import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:3006";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "tayoribod",
    version: "1.0.0",
  });

  server.registerTool(
    "search_faq",
    {
      title: "Search FAQ",
      description: "Search Tayoribod FAQ articles using a natural-language query.",
      inputSchema: {
        query: z.string().trim().min(1),
      },
    },
    async ({ query }) => {
      try {
        const response = await fetch(getMockFaqSearchUrl(), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          return toolError("FAQ検索APIでエラーが発生しました。時間をおいて再度お試しください。");
        }

        const result: unknown = await response.json();

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch {
        return toolError("FAQ検索APIに接続できませんでした。時間をおいて再度お試しください。");
      }
    },
  );

  return server;
}

function getMockFaqSearchUrl(): URL {
  const baseUrl = process.env.TAYORIBOD_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

  return new URL("/api/mock-faq-search", baseUrl);
}

function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

async function main(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Tayoribod MCP server is running on stdio.");
}

void main().catch((error: unknown) => {
  console.error("Failed to start the Tayoribod MCP server.", error);
  process.exitCode = 1;
});
