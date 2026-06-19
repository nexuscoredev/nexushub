import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  continueJarvisAgent,
  createJarvisAgent,
  CursorApiError,
  CursorConfigError,
  CursorRunError,
  CursorRunTimeoutError,
  isCursorConfigured,
  waitForJarvisRun,
} from '../_lib/cursorAgent.js';
import { verifyJarvisUser } from '../_lib/jarvisAuth.js';

const SYSTEM_PROMPT = `Você é JARVIS, assistente de engenharia da Nexus integrado ao NEXUS Hub.
Personalidade: técnico, objetivo, elegante e levemente irônico. Sempre em português brasileiro.
Você está numa conversa vinculada a um cliente e a um repositório específico.

Regras:
- Foque no contexto do cliente/repositório desta conversa.
- Seja claro e prático. Use **negrito**, listas e blocos de código quando ajudar.
- Quando analisar ou propor mudanças de código, explique o impacto antes.
- Se faltar contexto (repo não configurado), diga e oriente o próximo passo.
- Responda em texto direto (sem precisar de JSON).`;

interface ThreadRow {
  id: string;
  user_id: string;
  cliente_id: string | null;
  repo_url: string | null;
  repo_ref: string | null;
  titulo: string;
  cursor_agent_id: string | null;
}

function deriveTitle(message: string): string {
  const clean = message.trim().replace(/\s+/g, ' ');
  return clean.length > 60 ? `${clean.slice(0, 57)}…` : clean || 'Nova conversa';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isCursorConfigured()) {
    return res.status(503).json({
      error: 'JARVIS indisponível: configure CURSOR_API_KEY na Vercel.',
      configured: false,
    });
  }

  const user = await verifyJarvisUser(req.headers.authorization);
  if (!user) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const body = req.body as { threadId?: string; message?: string };
  const threadId = typeof body.threadId === 'string' ? body.threadId : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!threadId || !message) {
    return res.status(400).json({ error: 'threadId e message são obrigatórios' });
  }

  const { data: threadData, error: threadErr } = await user.supabase
    .from('hub_jarvis_threads')
    .select('id, user_id, cliente_id, repo_url, repo_ref, titulo, cursor_agent_id')
    .eq('id', threadId)
    .maybeSingle();

  if (threadErr || !threadData) {
    return res.status(404).json({ error: 'Conversa não encontrada' });
  }

  const thread = threadData as ThreadRow;

  // Persiste a mensagem do usuário
  await user.supabase.from('hub_jarvis_messages').insert({
    thread_id: thread.id,
    role: 'user',
    content: message,
  });

  try {
    let agentId = thread.cursor_agent_id ?? undefined;
    let runId: string;

    const repoNote = thread.repo_url
      ? `Repositório desta conversa: ${thread.repo_url} (ref: ${thread.repo_ref ?? 'main'}).`
      : 'Nenhum repositório vinculado a esta conversa.';

    if (agentId) {
      try {
        const continued = await continueJarvisAgent(agentId, message);
        runId = continued.runId;
      } catch (err) {
        if (err instanceof CursorApiError && (err.status === 404 || err.status === 409)) {
          const created = await createJarvisAgent(`${SYSTEM_PROMPT}\n\n${repoNote}\n\n${message}`, {
            repoUrl: thread.repo_url ?? undefined,
            repoRef: thread.repo_ref ?? undefined,
            name: `JARVIS — ${thread.titulo}`.slice(0, 100),
          });
          agentId = created.agentId;
          runId = created.runId;
        } else {
          throw err;
        }
      }
    } else {
      const created = await createJarvisAgent(`${SYSTEM_PROMPT}\n\n${repoNote}\n\n${message}`, {
        repoUrl: thread.repo_url ?? undefined,
        repoRef: thread.repo_ref ?? undefined,
        name: `JARVIS — ${thread.titulo}`.slice(0, 100),
      });
      agentId = created.agentId;
      runId = created.runId;
    }

    const rawContent = await waitForJarvisRun(agentId!, runId);
    const assistantText = rawContent.trim() || 'Sem resposta.';

    // Persiste a resposta do assistente
    await user.supabase.from('hub_jarvis_messages').insert({
      thread_id: thread.id,
      role: 'assistant',
      content: assistantText,
      run_id: runId,
    });

    // Atualiza a thread (agent id, título inicial, updated_at)
    const patch: Record<string, unknown> = {
      cursor_agent_id: agentId,
      updated_at: new Date().toISOString(),
    };
    if (thread.titulo === 'Nova conversa') {
      patch.titulo = deriveTitle(message);
    }
    await user.supabase.from('hub_jarvis_threads').update(patch).eq('id', thread.id);

    return res.status(200).json({
      message: assistantText,
      threadId: thread.id,
      cursorAgentId: agentId,
      configured: true,
    });
  } catch (e) {
    if (e instanceof CursorConfigError) {
      return res.status(503).json({ error: e.message, configured: false });
    }
    if (e instanceof CursorRunTimeoutError) {
      return res.status(504).json({ error: e.message });
    }
    if (e instanceof CursorRunError) {
      return res.status(502).json({ error: 'O agente Cursor não concluiu a resposta.' });
    }
    if (e instanceof CursorApiError) {
      console.error('[jarvis/thread-chat] Cursor API', e.status, e.message);
      if (e.status === 401 || e.status === 403) {
        return res.status(503).json({
          error: 'CURSOR_API_KEY inválida ou sem permissão para Cloud Agents.',
          configured: false,
        });
      }
      return res.status(502).json({ error: 'Falha ao consultar o Cursor Cloud Agent' });
    }
    console.error('[jarvis/thread-chat]', e);
    return res.status(500).json({ error: 'Erro interno do JARVIS' });
  }
}

export const config = {
  maxDuration: 60,
};
