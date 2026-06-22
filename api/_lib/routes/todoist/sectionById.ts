import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  todoistDeleteSection,
  todoistGetSection,
  todoistUpdateSection,
} from '../../todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sectionId = req.query.sectionId as string | undefined;
  if (!sectionId) {
    return res.status(400).json({ error: 'sectionId obrigatório' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    if (req.method === 'GET') {
      const section = await todoistGetSection(sectionId);
      return res.status(200).json({ section });
    }

    if (req.method === 'DELETE') {
      await todoistDeleteSection(sectionId);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const body = req.body as { name?: string; section_order?: number };
      const section = await todoistUpdateSection(sectionId, body);
      return res.status(200).json({ section });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao processar seção',
    });
  }
}
