import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTodoistToken, todoistFilterTasks } from '../../todoist.js';

function queryString(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    const query = queryString(req.query.query);
    if (!query) {
      return res.status(400).json({ error: 'query obrigatório' });
    }
    const lang = queryString(req.query.lang);
    const tasks = await todoistFilterTasks(query, lang);
    return res.status(200).json({ tasks });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao filtrar tarefas',
    });
  }
}
