import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  mapTodoistTask,
  todoistFetchCollaborators,
  todoistQuickAddTask,
  type TodoistCollaborator,
} from '../../_lib/todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    const body = req.body as {
      text?: string;
      note?: string;
      project_id?: string;
      section_id?: string;
    };
    if (!body?.text?.trim()) {
      return res.status(400).json({ error: 'text obrigatório' });
    }

    const raw = await todoistQuickAddTask({
      text: body.text.trim(),
      note: body.note?.trim(),
      project_id: body.project_id?.trim(),
      section_id: body.section_id?.trim(),
    });

    let collaborators: TodoistCollaborator[] = [];
    if (raw.project_id) {
      try {
        collaborators = await todoistFetchCollaborators(raw.project_id);
      } catch {
        collaborators = [];
      }
    }

    const task = mapTodoistTask(raw, false, collaborators);
    return res.status(200).json({ task });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao adicionar tarefa',
    });
  }
}
