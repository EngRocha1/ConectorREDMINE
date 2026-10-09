# ConectorREDMINE

[![CI](https://github.com/EngRocha1/ConectorREDMINE/actions/workflows/ci.yml/badge.svg)](https://github.com/EngRocha1/ConectorREDMINE/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 18+](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

**Conector MCP oficial para Redmine** — issues, versões/sprints (Planejamento), time entries, wiki e metadados.

Funciona com:

| Cliente | Como conectar |
|---------|----------------|
| **Grok** | [Custom connector](https://grok.com/connectors) → URL pública `/mcp` |
| **Claude Desktop / Code** | MCP stdio (`npx` ou `node`) |
| **Cursor / VS Code** | `mcp.json` stdio |
| **xAI API** | [Remote MCP tools](https://x.ai/docs/developers/tools/remote-mcp) |

**Repo:** https://github.com/EngRocha1/ConectorREDMINE

---

## Tools disponíveis (v1.1)

### Projetos & issues
| Tool | Função |
|------|--------|
| `redmine_list_projects` | Listar projetos |
| `redmine_get_project` | Detalhe (+ versions/trackers) |
| `redmine_list_issues` | Filtrar issues (status, sprint, responsável…) |
| `redmine_get_issue` | Detalhe + journals/anexos |
| `redmine_create_issue` | Criar |
| `redmine_update_issue` | Atualizar (versão, datas, notas…) |

### Versões (sprints do roadmap nativo)
| Tool | Função |
|------|--------|
| `redmine_list_versions` | Listar |
| `redmine_create_version` | Criar sprint/milestone |
| `redmine_update_version` | Abrir/fechar, datas, sharing |

### Tempo
| Tool | Função |
|------|--------|
| `redmine_list_time_entries` | Listar apontamentos |
| `redmine_create_time_entry` | Lançar horas |
| `redmine_update_time_entry` | Editar |
| `redmine_delete_time_entry` | Remover |
| `redmine_list_time_entry_activities` | Atividades |

### Wiki
| Tool | Função |
|------|--------|
| `redmine_list_wiki_pages` | Índice |
| `redmine_get_wiki_page` | Ler |
| `redmine_update_wiki_page` | Criar/atualizar |

### Metadados
| Tool | Função |
|------|--------|
| `redmine_list_statuses` | Status (ids) |
| `redmine_list_trackers` | Trackers |
| `redmine_list_priorities` | Prioridades |
| `redmine_current_user` | Quem sou eu |
| `redmine_raw_get` | GET genérico |

> **Agile Sprints (plugin RedmineUP):** muitas instalações retornam **404** na API do plugin. Use **Versões** nativas — alimentam a tela **Planejamento** e `fixed_version_id` nas issues.

---

## Instalação

### Opção A — `npx` (sem clone)

```bash
# stdio (Claude / Cursor)
REDMINE_URL=https://seu-redmine.com \
REDMINE_API_KEY=sua_chave \
npx -y github:EngRocha1/ConectorREDMINE
```

Após publicar no npm (`conector-redmine`):

```bash
npx -y conector-redmine
```

### Opção B — clone

```bash
git clone https://github.com/EngRocha1/ConectorREDMINE.git
cd ConectorREDMINE
npm install
cp .env.example .env   # edite URL e key
```

### Opção C — Docker

```bash
export REDMINE_URL=https://seu-redmine.com
export REDMINE_API_KEY=sua_chave

docker compose up -d --build
# health: http://localhost:3100/health
# MCP:    http://localhost:3100/mcp
```

Imagem local:

```bash
docker build -t conector-redmine .
docker run --rm -p 3100:3100 \
  -e REDMINE_URL=https://seu-redmine.com \
  -e REDMINE_API_KEY=sua_chave \
  conector-redmine
```

---

## Grok — custom connector (oficial)

1. Suba o HTTP:

```bash
npm run http
# ou: docker compose up -d
```

2. Túnel público (obrigatório):

```bash
ngrok http 3100
# URL tipo https://abc123.ngrok-free.app
```

3. Em **[grok.com/connectors](https://grok.com/connectors)** → **New Connector** → **Custom**:
   - **Name:** `ConectorREDMINE`
   - **Server URL:** `https://abc123.ngrok-free.app/mcp`

4. Auth: `REDMINE_API_KEY` no ambiente **ou** header `Authorization: Bearer <key>`.

Docs xAI: [Connectors](https://x.ai/docs/grok/connectors) · [Tunneling](https://x.ai/docs/grok/connectors/custom-mcp-tunneling) · [Remote MCP](https://x.ai/docs/developers/tools/remote-mcp)

### Uso direto no prompt (fallback sem MCP)

```text
Redmine REST:
Base: https://projetos.exemplo.com
Header: X-Redmine-API-Key: SUA_CHAVE
Liste /projects/414/versions.json e issues status_id=*
```

---

## Claude Desktop

Arquivo de config:

| SO | Caminho |
|----|---------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": ["-y", "github:EngRocha1/ConectorREDMINE"],
      "env": {
        "REDMINE_URL": "https://seu-redmine.com",
        "REDMINE_API_KEY": "sua_chave"
      }
    }
  }
}
```

Reinicie o Claude Desktop.

### Claude Code

```bash
claude mcp add redmine \
  --env REDMINE_URL=https://seu-redmine.com \
  --env REDMINE_API_KEY=sua_chave \
  -- npx -y github:EngRocha1/ConectorREDMINE
```

---

## Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": ["-y", "github:EngRocha1/ConectorREDMINE"],
      "env": {
        "REDMINE_URL": "https://seu-redmine.com",
        "REDMINE_API_KEY": "sua_chave"
      }
    }
  }
}
```

---

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `REDMINE_URL` | sim | URL base sem `/` final |
| `REDMINE_API_KEY` | sim* | Chave (`Minha conta → API`) — *HTTP pode usar Bearer* |
| `REDMINE_READ_ONLY` | não | `true` bloqueia escrita |
| `PORT` | não | HTTP (padrão `3100`) |

Ative a REST API em **Administração → Configurações → API**.

---

## Exemplos de prompts

- “Liste versões do projeto 414 e issues da Sprint 3”
- “Crie Sprint 5 (19–23/10) com sharing=tree e feche a Sprint 3”
- “Lance 2h na issue #6332 com comentário ‘revisão US’”
- “Mostre a wiki Wiki do projeto hemopi-2-0”
- “Dashboard: contagem Nova vs Em Validação por fixed_version”

---

## Segurança

- Nunca commite API keys.
- Use usuário com permissões mínimas.
- Em túnel público, prefira Bearer por request ou `REDMINE_READ_ONLY=true` para demos.
- Rotacione a key se exposta.

---

## Arquitetura

```
Grok / Claude / Cursor
        │  MCP (stdio ou Streamable HTTP)
        ▼
 ConectorREDMINE (tools tipadas + Zod)
        │  REST + X-Redmine-API-Key
        ▼
     Redmine Server
```

Não emula navegador: usa a **API REST oficial** (estável e auditável).

---

## Desenvolvimento & CI

```bash
npm install
npm test
npm run stdio
npm run http
```

GitHub Actions roda testes e `node --check` em todo push na `main`.

Ver [CONTRIBUTING.md](CONTRIBUTING.md).

### Publicar no npm (maintainers)

```bash
npm login
npm version minor
npm publish --access public
git push --follow-tags
```

Depois: `npx -y conector-redmine`.

---

## Changelog

### 1.1.0
- Time entries (CRUD) + activities
- Wiki (list/get/update)
- Statuses, trackers, priorities
- Docker + docker-compose + healthcheck
- CI GitHub Actions
- package pronto para npm / `npx`
- README e CONTRIBUTING

### 1.0.0
- Issues, projetos, versões, stdio + HTTP para Grok

---

## Licença

MIT © [EngRocha1](https://github.com/EngRocha1) e contribuidores

---

## Links

- [Redmine REST API](https://www.redmine.org/projects/redmine/wiki/Rest_api)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Grok Connectors](https://x.ai/docs/grok/connectors)
- [xAI Remote MCP](https://x.ai/docs/developers/tools/remote-mcp)
