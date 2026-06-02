import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  mapTodoistTask,
  todoistFetch,
  type TodoistTaskV1,
} from '../../_lib/todoist.js';

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
        await todoistFetch<null>(`/tasks/${taskId}/close`, { method: 'POST' });
      } else {
        await todoistFetch<null>(`/tasks/${taskId}/reopen`, { method: 'POST' });
      }
    }

    let task = null;
    try {
      const raw = await todoistFetch<TodoistTaskV1>(`/tasks/${taskId}`);
      task = mapTodoistTask(raw);
    } catch {
      task = {
        id: taskId,
        is_completed: Boolean(body.is_completed),
      };
    }

    return res.status(200).json({ task });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao atualizar tarefa',
    });
  }
}
