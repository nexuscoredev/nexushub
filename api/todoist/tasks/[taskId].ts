import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTodoistToken, todoistFetch } from '../../_lib/todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const taskId = req.query.taskId as string | undefined;
  if (!taskId) {
    return res.status(400).json({ error: 'taskId obrigatório' });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    const body = req.body as { is_completed?: boolean };
    if (typeof body.is_completed === 'boolean') {
      if (body.is_completed) {
        await todoistFetch(`/tasks/${taskId}/close`, { method: 'POST' });
      } else {
        await todoistFetch(`/tasks/${taskId}/reopen`, { method: 'POST' });
      }
    }
    const task = await todoistFetch(`/tasks/${taskId}`);
    return res.status(200).json({ task });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao atualizar tarefa',
    });
  }
}
