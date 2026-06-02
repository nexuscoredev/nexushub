# Contribuindo — NEXUS Hub

## Onde trabalhar

- Repositório Git em disco local (`C:\dev\NEXUS\nexushub` ou `~/dev/nexushub`).
- **Não** versionar via Google Drive ou OneDrive.

## Padrões

- TypeScript `strict`; `npm run build` deve passar.
- RLS obrigatório em tabelas `public`.
- Tokens de servidor sem prefixo `VITE_`.
- Felipe (`felipe@nexustech.com`) não deve ter acesso a Financeiro/Agenda (RLS + UI).

## Pull requests

1. Branch a partir de `main`.
2. Descreva o que mudou e como testar.
3. Aguarde CI verde.

## Migrations Supabase

1. `supabase migration new descricao_curta`
2. Edite o SQL gerado em `supabase/migrations/`.
3. Teste localmente antes do merge.

## Secrets

Nunca commite `.env.local`, service role ou tokens Todoist/Google.
