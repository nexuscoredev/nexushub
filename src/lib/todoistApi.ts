import type { AssigneeOption } from '../lib/todoistAssignees';
import type {
  CreateTaskInput,
  TodoistComment,
  TodoistLabel,
  TodoistProject,
  TodoistSection,
  TodoistTask,
  UpdateTaskInput,
} from '../types/todoist';

function translateTodoistError(message: string): string {
  const m = message.trim();
  const rules: [RegExp, string][] = [
    [/task not found/i, 'Tarefa não encontrada'],
    [/project not found/i, 'Projeto não encontrado'],
    [/section not found/i, 'Seção não encontrada'],
    [/label not found/i, 'Etiqueta não encontrada'],
    [/method not allowed/i, 'Método não permitido'],
    [/bad request/i, 'Requisição inválida'],
    [/forbidden/i, 'Sem permissão'],
    [/unauthorized/i, 'Não autorizado'],
    [/content is required/i, 'O título da tarefa é obrigatório'],
  ];
  for (const [pattern, pt] of rules) {
    if (pattern.test(m)) return pt;
  }
  return m;
}

async function parseJson<T>(res: Response): Promise<T & { error?: string; configured?: boolean }> {
  const body = (await res.json()) as T & { error?: string; configured?: boolean };
  if (!res.ok) {
    const raw = body.error ?? `Erro HTTP ${res.status}`;
    throw new Error(translateTodoistError(raw));
  }
  if (body.configured === false) {
    throw new Error(
      'Todoist não configurado no servidor. Defina TODOIST_API_TOKEN na Vercel ou .env local.',
    );
  }
  return body;
}

function qs(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// --- Tasks ---

export async function fetchTasks(opts?: {
  projectId?: string;
  sectionId?: string;
  label?: string;
  filterQuery?: string;
}): Promise<{
  tasks: TodoistTask[];
  projects: TodoistProject[];
  projectId: string | null;
  projectName: string | null;
  assigneeOptions: AssigneeOption[];
}> {
  const res = await fetch(
    `/api/todoist/tasks${qs({
      projectId: opts?.projectId,
      sectionId: opts?.sectionId,
      label: opts?.label,
      filterQuery: opts?.filterQuery,
    })}`,
  );
  const body = await parseJson<{
    tasks: TodoistTask[];
    projects: TodoistProject[];
    projectId: string | null;
    projectName: string | null;
    assigneeOptions?: AssigneeOption[];
  }>(res);
  return { ...body, assigneeOptions: body.assigneeOptions ?? [] };
}

export async function fetchTask(taskId: string): Promise<TodoistTask> {
  const res = await fetch(`/api/todoist/tasks/${taskId}`);
  const body = await parseJson<{ task: TodoistTask }>(res);
  return body.task;
}

export async function createTask(data: CreateTaskInput): Promise<TodoistTask> {
  const res = await fetch('/api/todoist/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await parseJson<{ task: TodoistTask }>(res);
  return body.task;
}

export async function updateTask(taskId: string, data: UpdateTaskInput): Promise<TodoistTask> {
  const res = await fetch(`/api/todoist/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await parseJson<{ task: TodoistTask }>(res);
  return body.task;
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`/api/todoist/tasks/${taskId}`, { method: 'DELETE' });
  await parseJson<{ ok: boolean }>(res);
}

export async function quickAddTask(opts: {
  text: string;
  note?: string;
  project_id?: string;
  section_id?: string;
}): Promise<TodoistTask> {
  const res = await fetch('/api/todoist/tasks/quick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  const body = await parseJson<{ task: TodoistTask }>(res);
  return body.task;
}

export async function filterTasks(query: string, lang?: string): Promise<TodoistTask[]> {
  const res = await fetch(`/api/todoist/tasks/filter${qs({ query, lang })}`);
  const body = await parseJson<{ tasks: TodoistTask[] }>(res);
  return body.tasks;
}

// --- Projects ---

export async function fetchProjects(): Promise<TodoistProject[]> {
  const res = await fetch('/api/todoist/projects');
  const body = await parseJson<{ projects: TodoistProject[] }>(res);
  return body.projects;
}

export async function createProject(name: string): Promise<TodoistProject> {
  const res = await fetch('/api/todoist/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const body = await parseJson<{ project: TodoistProject }>(res);
  return body.project;
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string },
): Promise<TodoistProject> {
  const res = await fetch(`/api/todoist/projects/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await parseJson<{ project: TodoistProject }>(res);
  return body.project;
}

export async function deleteProject(projectId: string): Promise<void> {
  const res = await fetch(`/api/todoist/projects/${projectId}`, { method: 'DELETE' });
  await parseJson<{ ok: boolean }>(res);
}

export async function archiveProject(projectId: string): Promise<TodoistProject> {
  const res = await fetch(`/api/todoist/projects/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'archive' }),
  });
  const body = await parseJson<{ project: TodoistProject }>(res);
  return body.project;
}

// --- Sections ---

export async function fetchSections(projectId?: string): Promise<TodoistSection[]> {
  const res = await fetch(`/api/todoist/sections${qs({ projectId })}`);
  const body = await parseJson<{ sections: TodoistSection[] }>(res);
  return body.sections;
}

export async function createSection(name: string, projectId: string): Promise<TodoistSection> {
  const res = await fetch('/api/todoist/sections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, project_id: projectId }),
  });
  const body = await parseJson<{ section: TodoistSection }>(res);
  return body.section;
}

export async function deleteSection(sectionId: string): Promise<void> {
  const res = await fetch(`/api/todoist/sections/${sectionId}`, { method: 'DELETE' });
  await parseJson<{ ok: boolean }>(res);
}

// --- Labels ---

export async function fetchLabels(): Promise<TodoistLabel[]> {
  const res = await fetch('/api/todoist/labels');
  const body = await parseJson<{ labels: TodoistLabel[] }>(res);
  return body.labels;
}

export async function createLabel(name: string): Promise<TodoistLabel> {
  const res = await fetch('/api/todoist/labels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const body = await parseJson<{ label: TodoistLabel }>(res);
  return body.label;
}

export async function deleteLabel(labelId: string): Promise<void> {
  const res = await fetch(`/api/todoist/labels/${labelId}`, { method: 'DELETE' });
  await parseJson<{ ok: boolean }>(res);
}

// --- Comments ---

export async function fetchComments(taskId: string): Promise<TodoistComment[]> {
  const res = await fetch(`/api/todoist/comments${qs({ taskId })}`);
  const body = await parseJson<{ comments: TodoistComment[] }>(res);
  return body.comments;
}

export async function createComment(taskId: string, content: string): Promise<TodoistComment> {
  const res = await fetch('/api/todoist/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, task_id: taskId }),
  });
  const body = await parseJson<{ comment: TodoistComment }>(res);
  return body.comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const res = await fetch(`/api/todoist/comments/${commentId}`, { method: 'DELETE' });
  await parseJson<{ ok: boolean }>(res);
}
