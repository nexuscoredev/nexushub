import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  todoistCreateLabel,
  todoistFetchLabels,
} from '../../todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getTodoistToken();
  if (!token) {
    if (req.method === 'GET') {
      return res.status(200).json({ configured: false, labels: [] });
    }
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    if (req.method === 'GET') {
      const labels = await todoistFetchLabels();
      return res.status(200).json({ configured: true, labels });
    }

    if (req.method === 'POST') {
      const body = req.body as { name?: string };
      if (!body?.name?.trim()) {
        return res.status(400).json({ error: 'name obrigatório' });
      }
      const label = await todoistCreateLabel(body.name.trim());
      return res.status(200).json({ label });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro Todoist',
    });
  }
}
