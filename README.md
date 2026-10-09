# ConectorREDMINE

[![CI](https://github.com/EngRocha1/ConectorREDMINE/actions/workflows/ci.yml/badge.svg)](https://github.com/EngRocha1/ConectorREDMINE/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 18+](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

**Conector MCP oficial para Redmine** — issues, versões/sprints, time entries, wiki e metadados.

| Cliente | Como conectar |
|---------|----------------|
| **Grok** | Custom connector + URL pública `/mcp` (ngrok no Windows 11) |
| **Claude / Cursor** | MCP stdio (`npx` ou `node`) |

**Repo:** https://github.com/EngRocha1/ConectorREDMINE  
**Guia Grok + Windows 11 + ngrok:** [docs/GROK-WINDOWS-NGROK.md](docs/GROK-WINDOWS-NGROK.md)

---

## Grok no Windows 11 (resumo)

```powershell
# 1) Instalar (primeira vez)
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install ngrok.ngrok
ngrok config add-authtoken SEU_TOKEN

# 2) Projeto
cd $env:USERPROFILE
git clone https://github.com/EngRocha1/ConectorREDMINE.git
cd ConectorREDMINE
npm install
copy .env.example .env
notepad .env   # REDMINE_URL + REDMINE_API_KEY

# 3) Terminal 1 — conector
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $k,$v = $_.Split('=',2)
  [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), 'Process')
}
npm run http

# 4) Terminal 2 — ngrok
ngrok http 3100
```

No Grok → Conectores → Personalizado:

| Campo | Valor |
|--------|--------|
| Nome | `REDMINE` |
| URL do servidor | `https://SEU-HOST.ngrok-free.app/mcp` |

Script opcional: `powershell -ExecutionPolicy Bypass -File .\scripts\start-grok.ps1`

Passo a passo completo: **[docs/GROK-WINDOWS-NGROK.md](docs/GROK-WINDOWS-NGROK.md)**

---

## Tools (v1.1)

Issues · projetos · versões/sprints · time entries · wiki · statuses · trackers · priorities · `redmine_raw_get`

> Plugin Agile Sprints pode dar 404 na API — use **Versões** nativas (Planejamento).

---

## Instalação rápida

```bash
git clone https://github.com/EngRocha1/ConectorREDMINE.git
cd ConectorREDMINE && npm install
cp .env.example .env   # edite URL e key
npm run http           # Grok + ngrok
# ou: npm run stdio    # Claude/Cursor
```

Docker: `docker compose up -d --build`

---

## Claude Desktop / Cursor

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

## Variáveis

| Variável | Descrição |
|----------|-----------|
| `REDMINE_URL` | Base sem `/` final |
| `REDMINE_API_KEY` | Chave API |
| `REDMINE_READ_ONLY` | `true` = só leitura |
| `PORT` | Padrão `3100` |

---

## Segurança

Não commite a key. URL ngrok free muda a cada restart — atualize no Grok.

## Licença

MIT © [EngRocha1](https://github.com/EngRocha1)
