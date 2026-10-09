import { z } from "zod";
import { qs } from "./redmine-client.js";

function ok(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {ReturnType<import('./redmine-client.js').createClient>} client
 */
export function registerTools(server, client) {
  // ═══════════ Projetos ═══════════
  server.tool(
    "redmine_list_projects",
    "Lista projetos acessíveis no Redmine",
    {
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
      name: z.string().optional().describe("Filtro parcial pelo nome"),
    },
    async ({ limit = 25, offset = 0, name }) => {
      const data = await client.get(`/projects.json${qs({ limit, offset, name })}`);
      return ok({
        total_count: data.total_count,
        projects: (data.projects || []).map((p) => ({
          id: p.id,
          name: p.name,
          identifier: p.identifier,
          status: p.status,
          parent: p.parent,
        })),
      });
    }
  );

  server.tool(
    "redmine_get_project",
    "Detalhes de um projeto (use include=versions,trackers,issue_categories)",
    {
      project_id: z.union([z.string(), z.number()]),
      include: z.string().optional(),
    },
    async ({ project_id, include }) => {
      return ok(await client.get(`/projects/${project_id}.json${qs({ include })}`));
    }
  );

  // ═══════════ Issues ═══════════
  server.tool(
    "redmine_list_issues",
    "Lista/filtra issues. status_id: open|closed|*|id. assigned_to_id: me|id. fixed_version_id: sprint/versão.",
    {
      project_id: z.union([z.string(), z.number()]).optional(),
      status_id: z.string().optional(),
      assigned_to_id: z.string().optional(),
      fixed_version_id: z.union([z.string(), z.number()]).optional(),
      tracker_id: z.union([z.string(), z.number()]).optional(),
      subject: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
      sort: z.string().optional(),
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
      if (args.subject) params.subject = `~${args.subject}`;
      const data = await client.get(`/issues.json${qs(params)}`);
      return ok({
        total_count: data.total_count,
        issues: (data.issues || []).map((i) => ({
          id: i.id,
          subject: i.subject,
          status: i.status?.name,
          status_id: i.status?.id,
          tracker: i.tracker?.name,
          priority: i.priority?.name,
          assigned_to: i.assigned_to?.name,
          project: i.project?.name,
          project_id: i.project?.id,
          fixed_version: i.fixed_version?.name,
          fixed_version_id: i.fixed_version?.id,
          start_date: i.start_date,
          due_date: i.due_date,
          done_ratio: i.done_ratio,
          updated_on: i.updated_on,
        })),
      });
    }
  );

  server.tool(
    "redmine_get_issue",
    "Detalhe completo de uma issue",
    {
      id: z.number().int(),
      include: z.string().optional().describe("journals,attachments,relations,children,watchers"),
    },
    async ({ id, include = "journals,attachments,relations" }) => {
      return ok(await client.get(`/issues/${id}.json${qs({ include })}`));
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
      start_date: z.string().optional(),
      due_date: z.string().optional(),
      estimated_hours: z.number().optional(),
      parent_issue_id: z.number().int().optional(),
    },
    async (fields) => {
      const data = await client.post("/issues.json", { issue: { ...fields } });
      return ok({ ok: true, id: data.issue?.id, issue: data.issue });
    }
  );

  server.tool(
    "redmine_update_issue",
    "Atualiza issue (status, versão/sprint, datas, responsável, notas)",
    {
      id: z.number().int(),
      subject: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      status_id: z.number().int().optional(),
      priority_id: z.number().int().optional(),
      assigned_to_id: z.number().int().optional(),
      fixed_version_id: z.union([z.number().int(), z.literal("")]).optional(),
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
      return ok({ ok: true, issue: data.issue });
    }
  );

  // ═══════════ Versões / sprints (Planejamento nativo) ═══════════
  server.tool(
    "redmine_list_versions",
    "Lista versões (sprints/milestones do roadmap nativo)",
    { project_id: z.union([z.string(), z.number()]) },
    async ({ project_id }) => {
      const data = await client.get(`/projects/${project_id}/versions.json`);
      return ok({
        versions: (data.versions || []).map((v) => ({
          id: v.id,
          name: v.name,
          status: v.status,
          due_date: v.due_date,
          description: v.description,
          sharing: v.sharing,
        })),
      });
    }
  );

  server.tool(
    "redmine_create_version",
    "Cria versão/sprint no Planejamento (sharing=tree recomendado)",
    {
      project_id: z.union([z.string(), z.number()]),
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["open", "locked", "closed"]).optional(),
      due_date: z.string().optional(),
      sharing: z.enum(["none", "descendants", "hierarchy", "tree", "system"]).optional(),
    },
    async ({ project_id, ...fields }) => {
      const version = { status: "open", sharing: "tree", ...fields };
      const data = await client.post(`/projects/${project_id}/versions.json`, { version });
      return ok({ ok: true, version: data.version });
    }
  );

  server.tool(
    "redmine_update_version",
    "Atualiza versão (status, due_date, sharing, nome)",
    {
      id: z.number().int(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["open", "locked", "closed"]).optional(),
      due_date: z.string().optional(),
      sharing: z.enum(["none", "descendants", "hierarchy", "tree", "system"]).optional(),
    },
    async ({ id, ...fields }) => {
      const version = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined) version[k] = v;
      }
      await client.put(`/versions/${id}.json`, { version });
      return ok({ ok: true, id, updated: version });
    }
  );

  // ═══════════ Time entries ═══════════
  server.tool(
    "redmine_list_time_entries",
    "Lista apontamentos de horas",
    {
      project_id: z.union([z.string(), z.number()]).optional(),
      issue_id: z.number().int().optional(),
      user_id: z.string().optional().describe("me ou id"),
      from: z.string().optional().describe("YYYY-MM-DD"),
      to: z.string().optional().describe("YYYY-MM-DD"),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    },
    async (args) => {
      const data = await client.get(
        `/time_entries.json${qs({
          project_id: args.project_id,
          issue_id: args.issue_id,
          user_id: args.user_id,
          from: args.from,
          to: args.to,
          limit: args.limit ?? 50,
          offset: args.offset ?? 0,
        })}`
      );
      return ok({
        total_count: data.total_count,
        time_entries: (data.time_entries || []).map((t) => ({
          id: t.id,
          project: t.project?.name,
          issue: t.issue?.id,
          user: t.user?.name,
          activity: t.activity?.name,
          hours: t.hours,
          comments: t.comments,
          spent_on: t.spent_on,
        })),
      });
    }
  );

  server.tool(
    "redmine_create_time_entry",
    "Registra horas em uma issue ou projeto",
    {
      issue_id: z.number().int().optional(),
      project_id: z.union([z.string(), z.number()]).optional(),
      hours: z.number().positive(),
      spent_on: z.string().optional().describe("YYYY-MM-DD (padrão hoje)"),
      activity_id: z.number().int().optional(),
      comments: z.string().optional(),
    },
    async (fields) => {
      if (!fields.issue_id && !fields.project_id) {
        throw new Error("Informe issue_id ou project_id");
      }
      const data = await client.post("/time_entries.json", {
        time_entry: { ...fields },
      });
      return ok({ ok: true, time_entry: data.time_entry });
    }
  );

  server.tool(
    "redmine_update_time_entry",
    "Atualiza um apontamento de horas",
    {
      id: z.number().int(),
      hours: z.number().positive().optional(),
      spent_on: z.string().optional(),
      activity_id: z.number().int().optional(),
      comments: z.string().optional(),
    },
    async ({ id, ...fields }) => {
      const time_entry = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined) time_entry[k] = v;
      }
      await client.put(`/time_entries/${id}.json`, { time_entry });
      return ok({ ok: true, id, updated: time_entry });
    }
  );

  server.tool(
    "redmine_delete_time_entry",
    "Remove um apontamento de horas",
    { id: z.number().int() },
    async ({ id }) => {
      await client.del(`/time_entries/${id}.json`);
      return ok({ ok: true, deleted: id });
    }
  );

  // ═══════════ Wiki ═══════════
  server.tool(
    "redmine_list_wiki_pages",
    "Lista páginas wiki de um projeto",
    { project_id: z.union([z.string(), z.number()]) },
    async ({ project_id }) => {
      const data = await client.get(`/projects/${project_id}/wiki/index.json`);
      return ok({
        wiki_pages: (data.wiki_pages || []).map((w) => ({
          title: w.title,
          version: w.version,
          created_on: w.created_on,
          updated_on: w.updated_on,
        })),
      });
    }
  );

  server.tool(
    "redmine_get_wiki_page",
    "Obtém conteúdo de uma página wiki",
    {
      project_id: z.union([z.string(), z.number()]),
      title: z.string().describe("Título da página (ex: Wiki)"),
    },
    async ({ project_id, title }) => {
      const enc = encodeURIComponent(title);
      return ok(await client.get(`/projects/${project_id}/wiki/${enc}.json`));
    }
  );

  server.tool(
    "redmine_update_wiki_page",
    "Cria ou atualiza página wiki (PUT upsert)",
    {
      project_id: z.union([z.string(), z.number()]),
      title: z.string(),
      text: z.string().describe("Conteúdo em Textile/Markdown conforme config do Redmine"),
      comments: z.string().optional(),
    },
    async ({ project_id, title, text, comments }) => {
      const enc = encodeURIComponent(title);
      await client.put(`/projects/${project_id}/wiki/${enc}.json`, {
        wiki_page: { text, comments },
      });
      return ok({ ok: true, project_id, title });
    }
  );

  // ═══════════ Metadados ═══════════
  server.tool(
    "redmine_list_statuses",
    "Lista status de issues (ids para update_issue)",
    {},
    async () => {
      const data = await client.get("/issue_statuses.json");
      return ok({
        issue_statuses: (data.issue_statuses || []).map((s) => ({
          id: s.id,
          name: s.name,
          is_closed: s.is_closed,
        })),
      });
    }
  );

  server.tool(
    "redmine_list_trackers",
    "Lista trackers (tipos de tarefa)",
    {},
    async () => {
      const data = await client.get("/trackers.json");
      return ok({
        trackers: (data.trackers || []).map((t) => ({ id: t.id, name: t.name })),
      });
    }
  );

  server.tool(
    "redmine_list_priorities",
    "Lista prioridades de issues",
    {},
    async () => {
      const data = await client.get("/enumerations/issue_priorities.json");
      return ok({
        issue_priorities: (data.issue_priorities || []).map((p) => ({
          id: p.id,
          name: p.name,
          is_default: p.is_default,
        })),
      });
    }
  );

  server.tool(
    "redmine_list_time_entry_activities",
    "Lista atividades de apontamento de horas",
    {},
    async () => {
      const data = await client.get("/enumerations/time_entry_activities.json");
      return ok({
        time_entry_activities: (data.time_entry_activities || []).map((a) => ({
          id: a.id,
          name: a.name,
          is_default: a.is_default,
        })),
      });
    }
  );

  // ═══════════ Conta / util ═══════════
  server.tool(
    "redmine_current_user",
    "Usuário autenticado pela API key",
    {},
    async () => ok(await client.get("/users/current.json"))
  );

  server.tool(
    "redmine_raw_get",
    "GET genérico (path relativo). Ex: /custom_fields.json",
    { path: z.string() },
    async ({ path }) => {
      const p = path.startsWith("/") ? path : `/${path}`;
      return ok(await client.get(p));
    }
  );
}
