import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTodoistToken, todoistFetch, type TodoistProject } from '../_lib/todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(200).json({ configured: false, projects: [] });
  }

  try {
    const projects = await todoistFetch<TodoistProject[]>('/projects');
    return res.status(200).json({ configured: true, projects });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro Todoist',
    });
  }
}
