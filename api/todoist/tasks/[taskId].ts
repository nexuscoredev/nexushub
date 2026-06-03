import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  todoistCloseTask,
  todoistDeleteTask,
  todoistGetTask,
  todoistMoveTask,
  todoistReopenTask,
  todoistUpdateTask,
  type MoveTaskInput,
  type UpdateTaskInput,
} from '../../_lib/todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const taskId = req.query.taskId as string | undefined;
  if (!taskId) {
    return res.status(400).json({ error: 'taskId obrigatório' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    if (req.method === 'GET') {
      const task = await todoistGetTask(taskId);
      return res.status(200).json({ task });
    }

    if (req.method === 'DELETE') {
      await todoistDeleteTask(taskId);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'PATCH' || req.method === 'POST') {
      const body = req.body as UpdateTaskInput & {
        is_completed?: boolean;
        move?: MoveTaskInput;
      };

      if (typeof body.is_completed === 'boolean') {
        if (body.is_completed) {
          await todoistCloseTask(taskId);
        } else {
          await todoistReopenTask(taskId);
        }
      }

      if (body.move) {
        await todoistMoveTask(taskId, body.move);
      }

      const hasUpdateFields =
        body.content !== undefined ||
        body.description !== undefined ||
        body.labels !== undefined ||
        body.priority !== undefined ||
        body.due_string !== undefined ||
        body.due_date !== undefined ||
        body.section_id !== undefined;

      let task;
      if (hasUpdateFields) {
        task = await todoistUpdateTask(taskId, {
          content: body.content,
          description: body.description,
          labels: body.labels,
          priority: body.priority,
          due_string: body.due_string,
          due_date: body.due_date,
          section_id: body.section_id,
        });
      } else {
        try {
          task = await todoistGetTask(taskId);
        } catch {
          task = {
            id: taskId,
            is_completed: Boolean(body.is_completed),
          };
        }
      }

      return res.status(200).json({ task });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao processar tarefa',
    });
  }
}
