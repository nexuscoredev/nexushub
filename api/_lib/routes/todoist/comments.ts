import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  todoistCreateComment,
  todoistFetchComments,
} from '../../todoist.js';

function queryString(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getTodoistToken();
  if (!token) {
    if (req.method === 'GET') {
      return res.status(200).json({ configured: false, comments: [] });
    }
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    if (req.method === 'GET') {
      const taskId = queryString(req.query.taskId);
      const projectId = queryString(req.query.projectId);
      if (!taskId && !projectId) {
        return res.status(400).json({ error: 'taskId ou projectId obrigatório' });
      }
      if (taskId && projectId) {
        return res.status(400).json({ error: 'Informe apenas taskId ou projectId' });
      }
      const comments = await todoistFetchComments({ taskId, projectId });
      return res.status(200).json({ configured: true, comments });
    }

    if (req.method === 'POST') {
      const body = req.body as { content?: string; task_id?: string; project_id?: string };
      if (!body?.content?.trim()) {
        return res.status(400).json({ error: 'content obrigatório' });
      }
      if (!body.task_id && !body.project_id) {
        return res.status(400).json({ error: 'task_id ou project_id obrigatório' });
      }
      const comment = await todoistCreateComment({
        content: body.content.trim(),
        task_id: body.task_id,
        project_id: body.project_id,
      });
      return res.status(200).json({ comment });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro Todoist',
    });
  }
}
