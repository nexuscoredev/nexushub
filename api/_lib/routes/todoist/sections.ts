import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  todoistCreateSection,
  todoistFetchSections,
} from '../../todoist.js';

function queryString(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getTodoistToken();
  if (!token) {
    if (req.method === 'GET') {
      return res.status(200).json({ configured: false, sections: [] });
    }
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    if (req.method === 'GET') {
      const projectId = queryString(req.query.projectId);
      const sections = await todoistFetchSections(projectId);
      return res.status(200).json({ configured: true, sections });
    }

    if (req.method === 'POST') {
      const body = req.body as { name?: string; project_id?: string };
      if (!body?.name?.trim() || !body?.project_id?.trim()) {
        return res.status(400).json({ error: 'name e project_id obrigatórios' });
      }
      const section = await todoistCreateSection(body.name.trim(), body.project_id.trim());
      return res.status(200).json({ section });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro Todoist',
    });
  }
}
