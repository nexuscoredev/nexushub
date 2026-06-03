import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTodoistToken, mapTodoistTask, todoistQuickAddTask } from '../../_lib/todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    const body = req.body as { text?: string; note?: string };
    if (!body?.text?.trim()) {
      return res.status(400).json({ error: 'text obrigatório' });
    }
    const raw = await todoistQuickAddTask(body.text.trim(), body.note?.trim());
    const task = mapTodoistTask(raw);
    return res.status(200).json({ task });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao adicionar tarefa',
    });
  }
}
