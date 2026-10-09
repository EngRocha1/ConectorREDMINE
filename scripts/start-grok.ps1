# ConectorREDMINE — sobe ngrok + servidor HTTP (Windows PowerShell)
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\start-grok.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Test-Path ".env")) {
  Write-Host "Crie o arquivo .env a partir de .env.example" -ForegroundColor Red
  exit 1
}

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $parts = $_.Split('=', 2)
  if ($parts.Length -lt 2) { return }
  Set-Item -Path "Env:$($parts[0].Trim())" -Value $parts[1].Trim()
}

$port = if ($env:PORT) { $env:PORT } else { "3100" }

if (-not $env:REDMINE_URL -or -not $env:REDMINE_API_KEY) {
  Write-Host "REDMINE_URL e REDMINE_API_KEY sao obrigatorios no .env" -ForegroundColor Red
  exit 1
}

Write-Host "Abrindo ngrok http $port ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http $port"

Start-Sleep -Seconds 2
Write-Host "Subindo ConectorREDMINE em http://localhost:$port/mcp" -ForegroundColor Green
Write-Host "No Grok use: https://SEU-HOST.ngrok-free.app/mcp" -ForegroundColor Yellow
npm run http
