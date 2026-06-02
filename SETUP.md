# Setup NEXUS Hub — checklist

Itens que **você** precisa fazer (secrets / contas). O resto já está no repositório.

## 1. Supabase (projeto `nexushub`, us-west-2)

URL: `https://ndcenckgtezerlmggola.supabase.co`

1. Dashboard → **SQL Editor** → executar na ordem:
   - `supabase/migrations/20260602100000_initial_schema.sql`
   - `supabase/migrations/20260602100001_rls_policies.sql`
   - `supabase/migrations/20260602100002_seed_data.sql`
2. **Settings → API** → copiar **anon public** key.
3. Local: `cp .env.example .env.local` e preencher `VITE_SUPABASE_ANON_KEY`.
4. Seed usuários (só com **service role**, nunca no Git):

   ```powershell
   $env:SUPABASE_URL="https://ndcenckgtezerlmggola.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="sua_service_role"
   npm run seed:users
   ```

5. Conectar o projeto **nexushub** ao plugin Supabase do Cursor (organização correta) se quiser migrations via MCP.

## 2. Vercel

Projeto: **nexushub** — https://nexushub-coral.vercel.app

Variáveis **já configuradas pelo agente** (se existirem no dashboard):

| Variável | Status |
|----------|--------|
| `VITE_SUPABASE_URL` | Pode estar definida |
| `GOOGLE_CALENDAR_ID_RAFAEL` | Pode estar definida |
| `GOOGLE_CALENDAR_ID_VINICIUS` | Pode estar definida |

**Você precisa adicionar:**

| Variável | Onde obter |
|----------|------------|
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `TODOIST_API_TOKEN` | Todoist → Integrations |
| `TODOIST_PROJECT_ID` | (opcional) ID do projeto da equipe |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Cloud (ou embeds abaixo) |
| `GOOGLE_CALENDAR_EMBED_RAFAEL` | (opcional MVP) URL iframe Calendar |
| `GOOGLE_CALENDAR_EMBED_VINICIUS` | (opcional MVP) URL iframe Calendar |

Depois de adicionar a anon key: **Redeploy** em Vercel (Deployments → Redeploy).

## 3. Local

```powershell
cd C:\dev\NEXUS\nexushub
npm install
npm run dev
```

APIs `/api/*` em dev: `npx vercel dev`

## 4. Login

| E-mail | Senha (após seed) |
|--------|-------------------|
| vinicius@nexustech.com | 123456 |
| rafael@nexustech.com | 123456 |
| felipe@nexustech.com | 123456 |

Trocar senhas em produção.
