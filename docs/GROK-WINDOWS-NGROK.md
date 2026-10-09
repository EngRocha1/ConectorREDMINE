# Grok + ConectorREDMINE no Windows 11 (terminal + ngrok)

Guia completo para expor o MCP no Grok usando só o PowerShell.

O Grok **não aceita** `localhost`. O ngrok cria uma URL HTTPS pública apontando para o seu PC.

Use **dois terminais**.

---

## 0) Pré-requisitos (primeira vez)

PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install ngrok.ngrok
```

Feche e abra o terminal. Confira:

```powershell
node -v
npm -v
git --version
ngrok version
```

---

## 1) Token ngrok (primeira vez)

1. Conta: https://dashboard.ngrok.com/signup  
2. Token: https://dashboard.ngrok.com/get-started/your-authtoken  

```powershell
ngrok config add-authtoken COLE_SEU_TOKEN_AQUI
```

---

## 2) Clonar e instalar

```powershell
cd $env:USERPROFILE
git clone https://github.com/EngRocha1/ConectorREDMINE.git
cd ConectorREDMINE
npm install
```

---

## 3) Configurar `.env`

```powershell
copy .env.example .env
notepad .env
```

Conteúdo:

```env
REDMINE_URL=https://projetos.ati.pi.gov.br
REDMINE_API_KEY=sua_chave_api_aqui
PORT=3100
REDMINE_READ_ONLY=false
```

Salve e feche.

---

## 4) Terminal 1 — conector

```powershell
cd $env:USERPROFILE\ConectorREDMINE

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $k, $v = $_.Split('=', 2)
  [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), 'Process')
}

npm run http
```

Deixe aberto. Teste: http://localhost:3100/health

---

## 5) Terminal 2 — ngrok

```powershell
ngrok http 3100
```

Copie o host HTTPS, por exemplo:

```text
https://a1b2c3d4.ngrok-free.app
```

URL do MCP:

```text
https://a1b2c3d4.ngrok-free.app/mcp
```

---

## 6) Grok → Conectores

1. https://grok.com/connectors  
2. Novo conector → Personalizado  
3. **Nome:** `REDMINE`  
4. **URL do servidor:** `https://SEU-HOST.ngrok-free.app/mcp`  
5. Adicionar conector  

---

## 7) Lembretes

- Os dois terminais precisam ficar abertos.  
- No plano free a URL do ngrok **muda** a cada restart → atualize no Grok.  
- Sempre termine a URL com `/mcp`.  
