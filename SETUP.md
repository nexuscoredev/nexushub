# Setup NEXUS Hub — checklist

Itens que **você** precisa fazer (secrets / contas). O resto já está no repositório.

## 1. Supabase (projeto `nexushub`, us-west-2)

URL: `https://ndcenckgtezerlmggola.supabase.co`

1. Dashboard → **SQL Editor** → executar **um arquivo por vez**, nesta ordem:
   - `supabase/migrations/20260602100000_initial_schema.sql` ← cria tabelas financeiras
   - `supabase/migrations/20260602100001_rls_policies.sql`
   - `supabase/migrations/20260602100002_seed_data.sql`
   - `supabase/migrations/20260602220000_fix_seed_hub_auth_user.sql` (se usar auth)
   - `supabase/migrations/20260603120000_hub_usuario_login.sql`
   - `supabase/migrations/20260603180000_align_finance_investments_columns.sql`
   - `supabase/migrations/20260604120000_finance_categoria.sql` ← filas Entrada/Saída no app

   Se aparecer `relation "hub_finance_receivables" does not exist`, você pulou o **initial_schema** — rode-o antes do arquivo de categoria.
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

Projeto: **nexushub** (time NEXUS) — https://nexuscorehub.vercel.app

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
| `GOOGLE_CALENDAR_ID_VINICIUS` | `viniciussantosdemorais2002@gmail.com` |
| `GOOGLE_CALENDAR_EMBED_VINICIUS` | URL iframe (MVP — já pode ir na Vercel) |
| `GOOGLE_CALENDAR_EMBED_RAFAEL` | (opcional) URL iframe Calendar |

**Agenda Vinícius (MVP embed):** basta `GOOGLE_CALENDAR_EMBED_VINICIUS` — a aba Agenda mostra o iframe do Google Calendar.

**Lista de eventos (API):** exige `GOOGLE_SERVICE_ACCOUNT_JSON` + compartilhar o calendário com o e-mail da service account (acesso leitor).

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

## 5. NexusClient — usuários dos clientes

Login por **usuário + senha** (não e-mail na tela).

1. Rodar a migration `supabase/migrations/20260609183000_hub_cliente_usuario_login.sql` no SQL Editor.
2. Seed (service role, nunca commitar a chave):

   ```powershell
   $env:SUPABASE_URL="https://ndcenckgtezerlmggola.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="sua_service_role"
   npm run seed:cliente-users
   ```

| Usuário | Senha (seed) | Cliente |
|---------|--------------|---------|
| `rgambiental` | `Nexus123!` | RG Ambiental |
| `ligeirinho` | `Nexus123!` | Ligeirinho |

Entrada: `/cliente/entrar` → NexusClient.

3. Rodar a migration `supabase/migrations/20260609200000_hub_cliente_dashboard_content.sql` para jornada, novidades e conteúdo demo por cliente.
