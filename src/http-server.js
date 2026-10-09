#!/usr/bin/env node
/**
 * ConectorREDMINE — MCP Streamable HTTP (Grok custom connector, remote MCP, Docker)
 *
 *   npm run http
 *   ngrok http 3100
 *   → grok.com/connectors → Custom → https://….ngrok-free.app/mcp
 */
import express from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createClient } from "./redmine-client.js";
import { registerTools } from "./tools.js";

const PORT = Number(process.env.PORT || 3100);
const baseUrl = process.env.REDMINE_URL;
const defaultKey = process.env.REDMINE_API_KEY;
const readOnly =
  String(process.env.REDMINE_READ_ONLY || "").toLowerCase() === "true";

if (!baseUrl) {
  console.error("[conector-redmine] Defina REDMINE_URL");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "conector-redmine",
    version: "1.1.0",
    redmine: baseUrl,
    mode: defaultKey ? "env-key" : "per-request-bearer",
    read_only: readOnly,
  });
});

app.get("/", (_req, res) => {
  res.type("text").send(
    "ConectorREDMINE MCP — use POST/GET /mcp | health em /health\n" +
      "https://github.com/EngRocha1/ConectorREDMINE\n"
  );
});

function resolveKey(req) {
  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const h = req.headers["x-redmine-api-key"];
  if (h) return String(h);
  return defaultKey;
}

app.all("/mcp", async (req, res) => {
  const apiKey = resolveKey(req);
  if (!apiKey) {
    res.status(401).json({
      error:
        "API key ausente. Authorization: Bearer <key> ou REDMINE_API_KEY no ambiente",
    });
    return;
  }

  try {
    const client = createClient({ baseUrl, apiKey, readOnly });
    const server = new McpServer({
      name: "conector-redmine",
      version: "1.1.0",
    });
    registerTools(server, client);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    res.on("close", () => {
      try {
        transport.close?.();
      } catch {
        /* ignore */
      }
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[conector-redmine]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: String(err.message || err) });
    }
  }
});

app.listen(PORT, () => {
  console.error(`[conector-redmine] HTTP :${PORT}/mcp  health :${PORT}/health`);
  console.error(`[conector-redmine] Redmine ${baseUrl}`);
});
