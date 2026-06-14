import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJarvisUser } from '../_lib/jarvisAuth.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'JARVIS indisponível: OPENAI_API_KEY não configurada.',
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
  };

  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const context = body.context ?? {};

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
    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.JARVIS_MODEL ?? 'gpt-4o-mini',
        temperature: 0.55,
        max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'system',
            content: `Contexto atual da área pessoal (somente leitura):\n${contextBlock}`,
          },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!openAiRes.ok) {
      const errText = await openAiRes.text();
      console.error('[jarvis/chat] OpenAI error', openAiRes.status, errText);
      return res.status(502).json({ error: 'Falha ao consultar o assistente' });
    }

    const data = (await openAiRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = data.choices?.[0]?.message?.content ?? '';
    const { message, actions } = parseAssistantPayload(rawContent);

    return res.status(200).json({
      message,
      actions,
      configured: true,
    });
  } catch (e) {
    console.error('[jarvis/chat]', e);
    return res.status(500).json({ error: 'Erro interno do JARVIS' });
  }
}
