import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  todoistFetchProjects,
  todoistFetchTasks,
} from '../_lib/todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(200).json({ configured: false, tasks: [] });
  }

  try {
    const projectId = process.env.TODOIST_PROJECT_ID;
    let projectName: string | null = null;
    let filterProjectId = projectId;

    const projects = await todoistFetchProjects();

    if (!filterProjectId) {
      const first = projects[0];
      filterProjectId = first?.id;
      projectName = first?.name ?? null;
    } else {
      projectName = projects.find((p) => p.id === filterProjectId)?.name ?? null;
    }

    const tasks = await todoistFetchTasks(filterProjectId ?? undefined);

    return res.status(200).json({
      configured: true,
      projectName,
      tasks: tasks.map((t) => ({
        id: t.id,
        content: t.content,
        description: t.description,
        is_completed: t.is_completed,
        due: t.due,
        priority: t.priority,
        url: t.url,
      })),
    });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro Todoist',
    });
  }
}
