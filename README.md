# NEXUS Hub

Painel administrativo central da **NEXUS Technology Systems** — sistemas integrados, fila operacional (Todoist), financeiro e agenda (Google Calendar).

- **Repositório:** [github.com/nexuscoredev/nexushub](https://github.com/nexuscoredev/nexushub)
- **Deploy:** Vercel (time NEXUS, projeto `nexushub`)
- **Backend:** Supabase (Auth + Postgres, projeto `nexushub`, região `us-west-2`)

## Stack

| Camada | Tecnologia |
|--------|------------|
| Front | React 19, TypeScript, Vite 6 |
| Roteamento | react-router-dom 7 |
| Estilo | CSS modules / global (tema dark NEXUS) |
| Auth / DB | Supabase Auth + Postgres + RLS |
| APIs secretas | Vercel Serverless em `/api/*` |

## Setup local

1. Clone em disco local (não use Google Drive / OneDrive como fonte de trabalho):

   ```bash
   git clone https://github.com/nexuscoredev/nexushub.git
   cd nexushub
   ```

2. Instale dependências:

   ```bash
   npm install
   ```

3. Copie variáveis de ambiente:

   ```bash
   cp .env.example .env.local
   ```

   Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Dashboard Supabase → Settings → API).

4. Aplique migrations no Supabase (CLI ou SQL Editor):

   ```bash
   supabase db push
   ```

   Ou execute os arquivos em `supabase/migrations/` na ordem.

5. Seed dos usuários da equipe (requer **service role** — nunca commitar):

   ```bash
   set SUPABASE_SERVICE_ROLE_KEY=...
   npm run seed:users
   ```

   Senha padrão documentada: `123456` — **altere em produção**.

6. Desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000).

   Para testar `/api/*` (Todoist, Google) localmente:

   ```bash
   npx vercel dev
   ```

## Usuários seed

| Nome | E-mail | Cargo | Senha (seed) |
|------|--------|-------|----------------|
| Vinícius | vinicius@nexustech.com | CTO | 123456 |
| Rafael | rafael@nexustech.com | CEO | 123456 |
| Felipe | felipe@nexustech.com | Desenvolvedor | 123456 |

**Financeiro e Agenda:** apenas `vinicius@nexustech.com` e `rafael@nexustech.com` (RLS + guard no front).

**Gestão (Usuários):** CEO, CTO, Administrador.

## Deploy Vercel

1. Conecte o repositório ao time NEXUS.
2. Framework: Vite — `buildCommand`: `npm run build`, `outputDirectory`: `dist`.
3. Variáveis de ambiente (Production):

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `TODOIST_API_TOKEN`
   - `TODOIST_PROJECT_ID` (opcional)
   - `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON ou base64)
   - `GOOGLE_CALENDAR_ID_RAFAEL`
   - `GOOGLE_CALENDAR_ID_VINICIUS`
   - `GOOGLE_CALENDAR_EMBED_RAFAEL` / `GOOGLE_CALENDAR_EMBED_VINICIUS` (fallback MVP)

**Nunca** use prefixo `VITE_` para tokens Todoist ou JSON da service account Google.

## Fluxo Git

```bash
git checkout -b feat/minha-feature
# commits...
git push -u origin feat/minha-feature
gh pr create
```

CI roda `npm run build` em PRs (`.github/workflows/ci.yml`).

## Site estático legado

Arquivos HTML antigos estão em `legacy-site/` apenas como referência — o produto é o hub React em `src/`.

## Licença

Uso interno NEXUS Technology Systems.
