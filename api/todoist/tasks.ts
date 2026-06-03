import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildAssigneeOptions,
  getTodoistToken,
  type TodoistCollaborator,
  todoistFetchCollaborators,
  todoistCreateTask,
  todoistFetchProjects,
  todoistFetchTasks,
  type CreateTaskInput,
} from '../_lib/todoist.js';

function queryString(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getTodoistToken();
  if (!token) {
    if (req.method === 'GET') {
      return res.status(200).json({ configured: false, tasks: [] });
    }
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    if (req.method === 'GET') {
      const queryProjectId = queryString(req.query.projectId);
      const sectionId = queryString(req.query.sectionId);
      const label = queryString(req.query.label);
      const filterQuery = queryString(req.query.filterQuery);
      const projectId = queryProjectId ?? process.env.TODOIST_PROJECT_ID;
      let projectName: string | null = null;
      let filterProjectId = projectId;

      const projects = await todoistFetchProjects();

      if (!filterProjectId && !filterQuery) {
        const first = projects[0];
        filterProjectId = first?.id;
        projectName = first?.name ?? null;
      } else if (filterProjectId) {
        projectName = projects.find((p) => p.id === filterProjectId)?.name ?? null;
      }

      let collaborators: TodoistCollaborator[] = [];
      if (filterProjectId) {
        try {
          collaborators = await todoistFetchCollaborators(filterProjectId);
        } catch {
          collaborators = [];
        }
      }

      const tasks = await todoistFetchTasks(
        {
          projectId: filterQuery ? undefined : filterProjectId ?? undefined,
          sectionId,
          label,
          filterQuery,
          filterLang: filterQuery ? 'pt' : undefined,
        },
        collaborators,
      );

      return res.status(200).json({
        configured: true,
        projectId: filterProjectId ?? null,
        projectName,
        projects,
        tasks,
        assigneeOptions: buildAssigneeOptions(collaborators),
      });
    }

    if (req.method === 'POST') {
      const body = req.body as CreateTaskInput;
      if (!body?.content?.trim()) {
        return res.status(400).json({ error: 'content obrigatório' });
      }
      const task = await todoistCreateTask({
        ...body,
        content: body.content.trim(),
      });
      return res.status(200).json({ task });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro Todoist',
    });
  }
}
