# Contribuindo para o ConectorREDMINE

Obrigado por contribuir!

## Desenvolvimento local

```bash
git clone https://github.com/EngRocha1/ConectorREDMINE.git
cd ConectorREDMINE
npm install
cp .env.example .env
# preencha REDMINE_URL e REDMINE_API_KEY de um ambiente de teste
npm run stdio   # ou npm run http
npm test
```

## Boas práticas

1. **Não** commitar secrets (API keys).
2. Preferir tools com nomes `redmine_*` e descrições claras em português ou inglês.
3. Usar Zod para schemas de entrada.
4. Respostas em JSON textual (`content: [{ type: "text", text: ... }]`).
5. Respeitar `REDMINE_READ_ONLY` no cliente HTTP.

## Pull requests

- Descreva o problema e a solução.
- Inclua testes quando fizer sentido.
- Mantenha o README atualizado se adicionar tools.

## Publicação npm (maintainers)

```bash
npm version patch|minor|major
npm publish --access public
git push --tags
```
