#!/usr/bin/env node
/**
 * ConectorREDMINE — MCP via Streamable HTTP (Grok custom connector, remote MCP).
 *
 * Suba localmente e exponha com ngrok/cloudflared:
 *   npm run http
 *   ngrok http 3100
 *
 * Em grok.com/connectors → New Connector → Custom → cole a URL pública + /mcp
 *
 * Auth opcional: header Authorization: Bearer <REDMINE_API_KEY>
 * ou use REDMINE_API_KEY fixo no ambiente do servidor.
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
const readOnly = String(process.env.REDMINE_READ_ONLY || "").toLowerCase() === "true";

if (!baseUrl) {
  console.error("Defina REDMINE_URL");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "conector-redmine",
    redmine: baseUrl,
    mode: defaultKey ? "env-key" : "per-request-bearer",
  });
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
      error: "API key ausente. Envie Authorization: Bearer <key> ou configure REDMINE_API_KEY",
    });
    return;
  }

  try {
    const client = createClient({ baseUrl, apiKey, readOnly });
    const server = new McpServer({
      name: "conector-redmine",
      version: "1.0.0",
    });
    registerTools(server, client);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    res.on("close", () => {
      transport.close?.();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: String(err.message || err) });
    }
  }
});

app.listen(PORT, () => {
  console.error(`ConectorREDMINE HTTP em http://0.0.0.0:${PORT}/mcp`);
  console.error(`Health: http://0.0.0.0:${PORT}/health`);
  console.error(`Redmine: ${baseUrl}`);
});
