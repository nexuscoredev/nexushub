import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  todoistArchiveProject,
  todoistDeleteProject,
  todoistGetProject,
  todoistUnarchiveProject,
  todoistUpdateProject,
} from '../../_lib/todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const projectId = req.query.projectId as string | undefined;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId obrigatório' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    if (req.method === 'GET') {
      const project = await todoistGetProject(projectId);
      return res.status(200).json({ project });
    }

    if (req.method === 'DELETE') {
      await todoistDeleteProject(projectId);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const body = req.body as {
        name?: string;
        description?: string;
        color?: string;
        action?: 'archive' | 'unarchive';
      };

      if (body.action === 'archive') {
        const project = await todoistArchiveProject(projectId);
        return res.status(200).json({ project });
      }
      if (body.action === 'unarchive') {
        const project = await todoistUnarchiveProject(projectId);
        return res.status(200).json({ project });
      }

      const project = await todoistUpdateProject(projectId, {
        name: body.name,
        description: body.description,
        color: body.color,
      });
      return res.status(200).json({ project });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao processar projeto',
    });
  }
}
