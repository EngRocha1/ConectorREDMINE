#!/usr/bin/env node
/**
 * ConectorREDMINE — MCP stdio (Claude, Cursor, Claude Code, npx)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "./redmine-client.js";
import { registerTools } from "./tools.js";

const baseUrl = process.env.REDMINE_URL;
const apiKey = process.env.REDMINE_API_KEY;
const readOnly =
  String(process.env.REDMINE_READ_ONLY || "").toLowerCase() === "true";

if (!baseUrl || !apiKey) {
  console.error(
    "[conector-redmine] Defina REDMINE_URL e REDMINE_API_KEY\n" +
      "Exemplo: REDMINE_URL=https://redmine.exemplo.com REDMINE_API_KEY=xxx npx conector-redmine"
  );
  process.exit(1);
}

const client = createClient({ baseUrl, apiKey, readOnly });
const server = new McpServer({
  name: "conector-redmine",
  version: "1.1.0",
});

registerTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
