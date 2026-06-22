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
} from '../../cursorAgent.js';
import { verifyJarvisUser } from '../../jarvisAuth.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface JarvisActionPayload {
  type: string;
  path?: string;
  transactionId?: string;
  pago?: boolean;
  url?: string;
}

const SYSTEM_PROMPT = `Você é JARVIS, assistente pessoal discreto integrado ao NEXUS Hub administrativo.
Personalidade: elegante, preciso, levemente irônico mas sempre respeitoso. Sempre em português brasileiro.
Você conhece a área pessoal do usuário (finanças, contas fixas/variáveis, humor do dia) e pode orientar ou executar ações simples.

Regras:
- Use APENAS os dados do contexto JSON fornecido. Nunca invente valores, contas ou IDs.
- Para marcar conta como paga, use transactionId exatamente como aparece em contasPendentes ou contasRecentes.
- Seja conciso (2–4 frases na maioria das respostas). Pode usar **negrito** ou listas curtas.
- Se não souber ou faltar dado, diga claramente e sugira ir à área pessoal.
- NÃO altere código, arquivos ou repositórios. Apenas responda ao usuário.

Responda SEMPRE com JSON válido neste formato (sem markdown fora do JSON):
{
  "message": "texto para o usuário",
  "actions": []
}

Ações opcionais (máximo 3 por resposta):
- {"type":"navigate","path":"/pessoal"} — abre área pessoal
- {"type":"navigate","path":"/pessoal?financeiro=1"} — abre finanças pessoais
- {"type":"toggle_conta_pago","transactionId":"<uuid>","pago":true|false}
- {"type":"open_url","url":"https://..."} — links externos (Spotify, Todoist, etc.)

Paths úteis: /pessoal, /dashboard, /agenda, /financeiro`;

function sanitizeActions(raw: unknown): JarvisActionPayload[] {
  if (!Array.isArray(raw)) return [];
  const out: JarvisActionPayload[] = [];
  for (const item of raw.slice(0, 3)) {
    if (!item || typeof item !== 'object') continue;
    const a = item as JarvisActionPayload;
    if (a.type === 'navigate' && typeof a.path === 'string' && a.path.startsWith('/')) {
      out.push({ type: 'navigate', path: a.path });
    } else if (
      a.type === 'toggle_conta_pago' &&
      typeof a.transactionId === 'string' &&
      typeof a.pago === 'boolean'
    ) {
      out.push({ type: 'toggle_conta_pago', transactionId: a.transactionId, pago: a.pago });
    } else if (a.type === 'open_url' && typeof a.url === 'string' && /^https?:\/\//i.test(a.url)) {
      out.push({ type: 'open_url', url: a.url });
    }
  }
  return out;
}

function parseAssistantPayload(content: string): { message: string; actions: JarvisActionPayload[] } {
  const trimmed = content.trim();
  try {
    const parsed = JSON.parse(trimmed) as { message?: unknown; actions?: unknown };
    return {
      message: typeof parsed.message === 'string' ? parsed.message : trimmed,
      actions: sanitizeActions(parsed.actions),
    };
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as { message?: unknown; actions?: unknown };
        return {
          message: typeof parsed.message === 'string' ? parsed.message : trimmed,
          actions: sanitizeActions(parsed.actions),
        };
      } catch {
        /* fallthrough */
      }
    }
    return { message: trimmed, actions: [] };
  }
}

function buildPrompt(
  messages: ChatMessage[],
  contextBlock: string,
  userName: string,
  isFollowUp: boolean,
): string {
  const history = messages
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'Usuário' : 'JARVIS'}: ${m.content}`)
    .join('\n');

  const latestUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  if (isFollowUp) {
    return `${SYSTEM_PROMPT}

Contexto atualizado da área pessoal (somente leitura):
${contextBlock}

Histórico recente:
${history}

Nova mensagem do ${userName}:
${latestUser}

Responda em JSON conforme o formato acima.`;
  }

  return `${SYSTEM_PROMPT}

Contexto atual da área pessoal (somente leitura):
${contextBlock}

Conversa:
${history}

Responda à última mensagem do ${userName} em JSON conforme o formato acima.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isCursorConfigured()) {
    return res.status(503).json({
      error: 'JARVIS indisponível: configure CURSOR_API_KEY na Vercel (conta Pro Nexus).',
      configured: false,
    });
  }

  const user = await verifyJarvisUser(req.headers.authorization);
  if (!user) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const body = req.body as {
    messages?: ChatMessage[];
    context?: Record<string, unknown>;
    cursorAgentId?: string;
  };

  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const context = body.context ?? {};
  const existingAgentId =
    typeof body.cursorAgentId === 'string' && body.cursorAgentId.startsWith('bc-')
      ? body.cursorAgentId
      : undefined;

  if (messages.length === 0 || messages[messages.length - 1]?.role !== 'user') {
    return res.status(400).json({ error: 'Envie ao menos uma mensagem do usuário' });
  }

  const contextBlock = JSON.stringify(
    {
      usuario: user.nome,
      cargo: user.cargo,
      ...context,
    },
    null,
    0,
  );

  try {
    let agentId = existingAgentId;
    let runId: string;

    const prompt = buildPrompt(messages, contextBlock, user.nome, Boolean(existingAgentId));

    if (existingAgentId) {
      try {
        const continued = await continueJarvisAgent(existingAgentId, prompt);
        runId = continued.runId;
      } catch (err) {
        if (err instanceof CursorApiError && (err.status === 404 || err.status === 409)) {
          const created = await createJarvisAgent(prompt);
          agentId = created.agentId;
          runId = created.runId;
        } else {
          throw err;
        }
      }
    } else {
      const created = await createJarvisAgent(prompt);
      agentId = created.agentId;
      runId = created.runId;
    }

    const rawContent = await waitForJarvisRun(agentId!, runId);
    const { message, actions } = parseAssistantPayload(rawContent);

    return res.status(200).json({
      message,
      actions,
      configured: true,
      cursorAgentId: agentId,
      provider: 'cursor',
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
      console.error('[jarvis/chat] Cursor API', e.status, e.message);
      if (e.status === 401 || e.status === 403) {
        return res.status(503).json({
          error: 'CURSOR_API_KEY inválida ou sem permissão para Cloud Agents.',
          configured: false,
        });
      }
      return res.status(502).json({ error: 'Falha ao consultar o Cursor Cloud Agent' });
    }
    console.error('[jarvis/chat]', e);
    return res.status(500).json({ error: 'Erro interno do JARVIS' });
  }
}

export const config = {
  maxDuration: 60,
};
