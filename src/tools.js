import { z } from "zod";
import { qs } from "./redmine-client.js";

/**
 * Registra todas as tools MCP no server.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {ReturnType<import('./redmine-client.js').createClient>} client
 */
export function registerTools(server, client) {
  // —— Projetos ——
  server.tool(
    "redmine_list_projects",
    "Lista projetos acessíveis no Redmine",
    {
      limit: z.number().int().min(1).max(100).optional().describe("Máximo de resultados (padrão 25)"),
      offset: z.number().int().min(0).optional(),
      name: z.string().optional().describe("Filtro parcial pelo nome"),
    },
    async ({ limit = 25, offset = 0, name }) => {
      const data = await client.get(
        `/projects.json${qs({ limit, offset, name })}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total_count: data.total_count,
                projects: (data.projects || []).map((p) => ({
                  id: p.id,
                  name: p.name,
                  identifier: p.identifier,
                  status: p.status,
                  parent: p.parent,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "redmine_get_project",
    "Detalhes de um projeto (inclui versões se include=versions)",
    {
      project_id: z.union([z.string(), z.number()]).describe("ID numérico ou identifier"),
      include: z
        .string()
        .optional()
        .describe("Ex: versions,trackers,issue_categories"),
    },
    async ({ project_id, include }) => {
      const data = await client.get(
        `/projects/${project_id}.json${qs({ include })}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // —— Issues ——
  server.tool(
    "redmine_list_issues",
    "Lista/filtra issues (tarefas). Use project_id, status_id (* = todos), assigned_to_id=me, fixed_version_id, etc.",
    {
      project_id: z.union([z.string(), z.number()]).optional(),
      status_id: z
        .string()
        .optional()
        .describe("open | closed | * | id numérico"),
      assigned_to_id: z.string().optional().describe("me ou id do usuário"),
      fixed_version_id: z.union([z.string(), z.number()]).optional().describe("ID da versão/sprint"),
      tracker_id: z.union([z.string(), z.number()]).optional(),
      subject: z.string().optional().describe("Busca no título (~)"),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
      sort: z.string().optional().describe("Ex: id:desc, updated_on:desc"),
    },
    async (args) => {
      const params = {
        limit: args.limit ?? 50,
        offset: args.offset ?? 0,
        project_id: args.project_id,
        status_id: args.status_id ?? "*",
        assigned_to_id: args.assigned_to_id,
        fixed_version_id: args.fixed_version_id,
        tracker_id: args.tracker_id,
        sort: args.sort ?? "id:desc",
      };
      if (args.subject) params["subject"] = `~${args.subject}`;
      const data = await client.get(`/issues.json${qs(params)}`);
      const slim = (data.issues || []).map((i) => ({
        id: i.id,
        subject: i.subject,
        status: i.status?.name,
        tracker: i.tracker?.name,
        priority: i.priority?.name,
        assigned_to: i.assigned_to?.name,
        project: i.project?.name,
        fixed_version: i.fixed_version?.name,
        start_date: i.start_date,
        due_date: i.due_date,
        done_ratio: i.done_ratio,
        updated_on: i.updated_on,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { total_count: data.total_count, issues: slim },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "redmine_get_issue",
    "Detalhe completo de uma issue (journals, anexos, relações)",
    {
      id: z.number().int().describe("ID da issue"),
      include: z
        .string()
        .optional()
        .describe("journals,attachments,relations,children,watchers"),
    },
    async ({ id, include = "journals,attachments,relations" }) => {
      const data = await client.get(`/issues/${id}.json${qs({ include })}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "redmine_create_issue",
    "Cria uma nova issue",
    {
      project_id: z.union([z.string(), z.number()]),
      subject: z.string().min(1),
      description: z.string().optional(),
      tracker_id: z.number().int().optional(),
      status_id: z.number().int().optional(),
      priority_id: z.number().int().optional(),
      assigned_to_id: z.number().int().optional(),
      fixed_version_id: z.number().int().optional(),
      start_date: z.string().optional().describe("YYYY-MM-DD"),
      due_date: z.string().optional().describe("YYYY-MM-DD"),
      estimated_hours: z.number().optional(),
      parent_issue_id: z.number().int().optional(),
    },
    async (fields) => {
      const issue = { ...fields };
      const data = await client.post("/issues.json", { issue });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { ok: true, id: data.issue?.id, issue: data.issue },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "redmine_update_issue",
    "Atualiza campos de uma issue (status, versão/sprint, datas, responsável, notas)",
    {
      id: z.number().int(),
      subject: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional().describe("Comentário no histórico"),
      status_id: z.number().int().optional(),
      priority_id: z.number().int().optional(),
      assigned_to_id: z.number().int().optional(),
      fixed_version_id: z
        .union([z.number().int(), z.literal("")])
        .optional()
        .describe("ID da versão ou string vazia para limpar"),
      start_date: z.string().optional(),
      due_date: z.string().optional(),
      done_ratio: z.number().int().min(0).max(100).optional(),
      estimated_hours: z.number().optional(),
      tracker_id: z.number().int().optional(),
    },
    async ({ id, ...fields }) => {
      const issue = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined) issue[k] = v;
      }
      await client.put(`/issues/${id}.json`, { issue });
      const data = await client.get(`/issues/${id}.json`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: true, issue: data.issue }, null, 2),
          },
        ],
      };
    }
  );

  // —— Versões (sprints no Planejamento nativo) ——
  server.tool(
    "redmine_list_versions",
    "Lista versões (sprints/milestones) de um projeto",
    {
      project_id: z.union([z.string(), z.number()]),
    },
    async ({ project_id }) => {
      const data = await client.get(`/projects/${project_id}/versions.json`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                versions: (data.versions || []).map((v) => ({
                  id: v.id,
                  name: v.name,
                  status: v.status,
                  due_date: v.due_date,
                  description: v.description,
                  sharing: v.sharing,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "redmine_create_version",
    "Cria uma versão (sprint no roadmap/Planejamento do Redmine)",
    {
      project_id: z.union([z.string(), z.number()]),
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["open", "locked", "closed"]).optional(),
      due_date: z.string().optional().describe("YYYY-MM-DD"),
      sharing: z
        .enum(["none", "descendants", "hierarchy", "tree", "system"])
        .optional()
        .describe("tree = árvore do projeto (recomendado)"),
    },
    async ({ project_id, ...fields }) => {
      const version = {
        status: "open",
        sharing: "tree",
        ...fields,
      };
      const data = await client.post(`/projects/${project_id}/versions.json`, {
        version,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: true, version: data.version }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "redmine_update_version",
    "Atualiza uma versão (status open/closed, due_date, sharing)",
    {
      id: z.number().int(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["open", "locked", "closed"]).optional(),
      due_date: z.string().optional(),
      sharing: z
        .enum(["none", "descendants", "hierarchy", "tree", "system"])
        .optional(),
    },
    async ({ id, ...fields }) => {
      const version = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined) version[k] = v;
      }
      await client.put(`/versions/${id}.json`, { version });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: true, id, updated: version }, null, 2),
          },
        ],
      };
    }
  );

  // —— Conta / util ——
  server.tool(
    "redmine_current_user",
    "Retorna o usuário autenticado pela API key",
    {},
    async () => {
      const data = await client.get("/users/current.json");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "redmine_raw_get",
    "GET genérico na API Redmine (path relativo, ex: /trackers.json). Use com cuidado.",
    {
      path: z.string().describe("Ex: /trackers.json ou /issue_statuses.json"),
    },
    async ({ path }) => {
      const p = path.startsWith("/") ? path : `/${path}`;
      const data = await client.get(p);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
