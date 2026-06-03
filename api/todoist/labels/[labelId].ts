import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  todoistDeleteLabel,
  todoistGetLabel,
  todoistUpdateLabel,
} from '../../_lib/todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const labelId = req.query.labelId as string | undefined;
  if (!labelId) {
    return res.status(400).json({ error: 'labelId obrigatório' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    if (req.method === 'GET') {
      const label = await todoistGetLabel(labelId);
      return res.status(200).json({ label });
    }

    if (req.method === 'DELETE') {
      await todoistDeleteLabel(labelId);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const body = req.body as { name?: string; color?: string };
      const label = await todoistUpdateLabel(labelId, body);
      return res.status(200).json({ label });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao processar etiqueta',
    });
  }
}
