#!/usr/bin/env node
/**
 * ConectorREDMINE — MCP via stdio (Claude Desktop, Cursor, Claude Code, etc.)
 *
 * Env:
 *   REDMINE_URL
 *   REDMINE_API_KEY
 *   REDMINE_READ_ONLY (opcional)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "./redmine-client.js";
import { registerTools } from "./tools.js";

const baseUrl = process.env.REDMINE_URL;
const apiKey = process.env.REDMINE_API_KEY;
const readOnly = String(process.env.REDMINE_READ_ONLY || "").toLowerCase() === "true";

if (!baseUrl || !apiKey) {
  console.error("Defina REDMINE_URL e REDMINE_API_KEY");
  process.exit(1);
}

const client = createClient({ baseUrl, apiKey, readOnly });
const server = new McpServer({
  name: "conector-redmine",
  version: "1.0.0",
});

registerTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
