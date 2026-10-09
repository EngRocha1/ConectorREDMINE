# ConectorREDMINE

**Conector MCP público para Redmine** — use com **Grok** (custom connector por URL), **Claude Desktop / Claude Code**, **Cursor**, **VS Code** e qualquer cliente compatível com [Model Context Protocol](https://modelcontextprotocol.io).

Repositório: [github.com/EngRocha1/ConectorREDMINE](https://github.com/EngRocha1/ConectorREDMINE)

---

## O que este conector faz

Expõe a REST API do Redmine como **tools** para o assistente de IA:

| Tool | Descrição |
|------|-----------|
| `redmine_list_projects` | Lista projetos |
| `redmine_get_project` | Detalhe do projeto (+ versões) |
| `redmine_list_issues` | Filtra issues (projeto, status, sprint/versão, responsável…) |
| `redmine_get_issue` | Detalhe + journals/anexos |
| `redmine_create_issue` | Cria tarefa |
| `redmine_update_issue` | Atualiza status, versão, datas, notas… |
| `redmine_list_versions` | Lista versões (**sprints do Planejamento nativo**) |
| `redmine_create_version` | Cria versão/sprint no roadmap |
| `redmine_update_version` | Abre/fecha versão, altera datas/sharing |
| `redmine_current_user` | Quem é a API key |
| `redmine_raw_get` | GET genérico (trackers, statuses…) |

> **Nota sobre “Sprints” do plugin Agile:** o plugin RedmineUP Agile usa entidade própria (`agile_sprints`). Muitas instalações **não expõem** essa API (404). As **Versões** nativas funcionam sempre e alimentam a tela **Planejamento**. Este conector cobre 100% das Versões + Issues.

---

## Pré-requisitos

1. Redmine com **REST API** habilitada (`Administração → Configurações → API`).
2. **API access key** do usuário (`Minha conta → Chave de acesso à API`).
3. **Node.js 18+**.

---

## Instalação rápida

```bash
git clone https://github.com/EngRocha1/ConectorREDMINE.git
cd ConectorREDMINE
npm install
cp .env.example .env
# edite .env com REDMINE_URL e REDMINE_API_KEY
```

---

## Uso 1 — Grok (conector oficial por URL)

O Grok aceita **Custom MCP connector** em [grok.com/connectors](https://grok.com/connectors).

### Passos

1. Suba o servidor HTTP:

```bash
export REDMINE_URL="https://seu-redmine.exemplo.com"
export REDMINE_API_KEY="sua_chave"
npm run http
# escuta em http://localhost:3100/mcp
```

2. Exponha na internet (obrigatório — localhost é rejeitado pelo Grok):

```bash
# opção A
ngrok http 3100
# copie a URL https://xxxx.ngrok-free.app

# opção B
cloudflared tunnel --url http://localhost:3100
```

3. Em **grok.com/connectors** → **New Connector** → **Custom**:
   - **Name:** `ConectorREDMINE`
   - **Server URL:** `https://SUA-URL-PUBLICA/mcp`

4. Se o servidor não tiver `REDMINE_API_KEY` no ambiente, configure autenticação com header:
   - `Authorization: Bearer <sua_api_key_redmine>`

Documentação xAI: [Connectors](https://x.ai/docs/grok/connectors) · [Tunneling](https://x.ai/docs/grok/connectors/custom-mcp-tunneling) · [Remote MCP](https://x.ai/docs/developers/tools/remote-mcp)

### Uso direto no prompt (sem conector salvo)

No chat do Grok ou via API xAI, você também pode passar a chave e pedir operações REST “manuais” (o modelo usa `curl`/raciocínio). O **conector MCP** é superior: tools tipadas, menos erro, reutilizável.

Exemplo de prompt “direto” (fallback):

```text
Use a API Redmine:
URL: https://projetos.exemplo.com
Header: X-Redmine-API-Key: SUA_CHAVE
Liste issues do projeto 414 com status_id=*
```

---

## Uso 2 — Claude Desktop / Claude Code (stdio)

### Claude Desktop (`claude_desktop_config.json`)

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
        "REDMINE_URL": "https://seu-redmine.exemplo.com",
        "REDMINE_API_KEY": "sua_chave_aqui"
      }
    }
  }
}
```

Ou apontando para o clone local:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "node",
      "args": ["/caminho/absoluto/ConectorREDMINE/src/index.js"],
      "env": {
        "REDMINE_URL": "https://seu-redmine.exemplo.com",
        "REDMINE_API_KEY": "sua_chave_aqui"
      }
    }
  }
}
```

Reinicie o Claude Desktop.

### Claude Code (CLI)

```bash
claude mcp add redmine --env REDMINE_URL=https://seu-redmine.com --env REDMINE_API_KEY=sua_chave -- node /caminho/ConectorREDMINE/src/index.js
```

---

## Uso 3 — Cursor / VS Code

`~/.cursor/mcp.json` ou `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "node",
      "args": ["./src/index.js"],
      "env": {
        "REDMINE_URL": "https://seu-redmine.exemplo.com",
        "REDMINE_API_KEY": "sua_chave"
      }
    }
  }
}
```

---

## Exemplos de pedidos ao assistente

- “Liste as versões (sprints) do projeto HEMOPI 2.0 (id 414)”
- “Crie a Sprint 5 de 19/10 a 23/10 com sharing=tree”
- “Mostre issues em validação do projeto 414”
- “Mova a issue #6332 para a versão Sprint 3 e due_date 2026-10-16”
- “Quantas issues Nova vs Em Validação por módulo M01/M02/M03?”

---

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `REDMINE_URL` | sim | Base URL sem `/` final |
| `REDMINE_API_KEY` | sim* | Chave do usuário (*no HTTP pode vir no Bearer) |
| `REDMINE_READ_ONLY` | não | `true` bloqueia POST/PUT/DELETE |
| `PORT` | não | Porta do modo HTTP (padrão `3100`) |

---

## Segurança

- **Nunca** commite a API key no Git.
- Prefira chave de um usuário com o **mínimo de permissões** necessárias.
- Em modo HTTP público (ngrok), use Bearer por requisição ou restrinja o tunnel.
- `REDMINE_READ_ONLY=true` para demos e dashboards só leitura.

---

## Arquitetura

```
┌─────────────┐     MCP (stdio / HTTP)     ┌──────────────────┐
│ Grok/Claude │ ◄────────────────────────► │ ConectorREDMINE  │
│ Cursor/etc  │                            │  tools.js        │
└─────────────┘                            └────────┬─────────┘
                                                    │ REST
                                                    ▼
                                           ┌──────────────────┐
                                           │  Redmine Server  │
                                           │  X-Redmine-API-Key│
                                           └──────────────────┘
```

- **stdio** → ideal para desktop local (Claude, Cursor).
- **HTTP `/mcp`** → ideal para Grok custom connector e MCP remoto.

Não “simula navegador”: usa a **API REST oficial** do Redmine (mais estável, auditável e rápida). Telas que só existem no plugin sem API (ex.: algumas UIs Agile) continuam manuais na interface web.

---

## Limitações conhecidas

1. **Agile Sprints** (plugin) podem retornar 404 via API — use **Versões** nativas.
2. Grok exige URL **pública HTTPS** (não localhost).
3. Cloudflare quick tunnels podem falhar com SSE; prefira **ngrok** se usar transporte SSE.

---

## Desenvolvimento

```bash
npm install
node src/index.js          # stdio
node src/http-server.js    # HTTP
```

Contribuições via PR são bem-vindas.

---

## Licença

MIT © colaboradores ConectorREDMINE

---

## Links úteis

- [Redmine REST API](https://www.redmine.org/projects/redmine/wiki/Rest_api)
- [MCP specification](https://modelcontextprotocol.io)
- [Grok Connectors](https://x.ai/docs/grok/connectors)
- [xAI Remote MCP](https://x.ai/docs/developers/tools/remote-mcp)
