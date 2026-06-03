const TODOIST_BASE = 'https://api.todoist.com/api/v1';

export function getTodoistToken(): string | undefined {
  return process.env.TODOIST_API_TOKEN;
}

interface PaginatedResponse<T> {
  results?: T[];
  items?: T[];
  next_cursor?: string | null;
}

export interface TodoistDue {
  date?: string;
  datetime?: string;
  string?: string;
  is_recurring?: boolean;
  lang?: string;
}

export interface TodoistProject {
  id: string;
  name: string;
  color?: string;
  is_archived?: boolean;
  description?: string;
}

export interface TodoistSection {
  id: string;
  name: string;
  project_id: string;
  section_order?: number;
  is_archived?: boolean;
}

export interface TodoistLabel {
  id: string;
  name: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
}

export interface TodoistComment {
  id: string;
  content: string;
  posted_at?: string;
  posted_uid?: string;
  task_id?: string;
  project_id?: string;
}

export interface TodoistTaskV1 {
  id: string;
  content: string;
  description?: string;
  checked?: boolean;
  due?: TodoistDue;
  priority: number;
  project_id: string;
  section_id?: string | null;
  parent_id?: string | null;
  order?: number;
  labels?: string[];
  note_count?: number;
  completed_at?: string | null;
  responsible_uid?: string | null;
}

export interface TodoistTaskRaw {
  id: string;
  content: string;
  description: string;
  is_completed: boolean;
  due?: TodoistDue;
  priority: number;
  url: string;
  project_id: string;
  section_id?: string | null;
  parent_id?: string | null;
  order?: number;
  labels?: string[];
  note_count?: number;
  responsible_uid?: string | null;
  assignee_name?: string | null;
  assignee_hub?: string | null;
}

export interface CreateTaskInput {
  content: string;
  description?: string;
  project_id?: string;
  section_id?: string;
  parent_id?: string;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_lang?: string;
  assignee_id?: number | string | null;
}

export interface UpdateTaskInput {
  content?: string;
  description?: string;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_lang?: string;
  section_id?: string;
  assignee_id?: number | string | null;
}

export interface MoveTaskInput {
  project_id?: string;
  section_id?: string;
  parent_id?: string;
}

import {
  assigneeFieldsForTodoistApi,
  buildAssigneeOptions,
  collaboratorDisplayName,
  type TodoistCollaborator,
} from './todoistAssignees.js';
import { hubPriorityToTodoistApi, todoistApiPriorityToHub } from './todoistPriority.js';

export type { TodoistCollaborator, AssigneeOption } from './todoistAssignees.js';
export { TEAM_ASSIGNEES, buildAssigneeOptions } from './todoistAssignees.js';

function buildTaskWriteBody(
  data: CreateTaskInput | UpdateTaskInput,
): Record<string, unknown> {
  const { assignee_id, priority, section_id: _section, due_string, due_lang, ...rest } =
    data as CreateTaskInput & UpdateTaskInput & { section_id?: string };
  const out: Record<string, unknown> = { ...rest };
  if (priority !== undefined) {
    out.priority = hubPriorityToTodoistApi(priority);
  }
  if (due_string !== undefined) {
    out.due_string = due_string;
    out.due_lang = due_lang ?? (due_string.trim() ? 'pt' : undefined);
  }
  Object.assign(out, assigneeFieldsForTodoistApi(assignee_id));
  return out;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function todoistRequest(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  const token = getTodoistToken();
  if (!token) throw new Error('TODOIST_API_TOKEN não configurado');

  const res = await fetch(`${TODOIST_BASE}${pathWithQuery}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Todoist API ${res.status}`);
  }

  return res;
}

async function todoistJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await todoistRequest(path, init);
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export async function todoistFetchAll<T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined;

  do {
    const page = await todoistJson<PaginatedResponse<T>>(
      `${path}${buildQuery({ ...query, cursor, limit: query.limit ?? 200 })}`,
    );
    items.push(...(page.results ?? page.items ?? []));
    cursor = page.next_cursor ?? undefined;
  } while (cursor);

  return items;
}

export function mapTodoistTask(
  task: TodoistTaskV1,
  isCompleted?: boolean,
  collaborators: TodoistCollaborator[] = [],
): TodoistTaskRaw {
  const completed = isCompleted ?? (Boolean(task.checked) || Boolean(task.completed_at));
  const options = buildAssigneeOptions(collaborators);
  const matched = options.find((o) => o.uid && o.uid === task.responsible_uid);
  const collab = task.responsible_uid
    ? collaborators.find((c) => c.id === task.responsible_uid)
    : undefined;

  return {
    id: task.id,
    content: task.content,
    description: task.description ?? '',
    is_completed: completed,
    due: task.due,
    priority: todoistApiPriorityToHub(task.priority),
    url: `https://todoist.com/showTask?id=${task.id}`,
    project_id: task.project_id,
    section_id: task.section_id ?? null,
    parent_id: task.parent_id ?? null,
    order: task.order ?? 0,
    labels: task.labels ?? [],
    note_count: task.note_count ?? 0,
    responsible_uid: task.responsible_uid ?? null,
    assignee_name: matched?.label ?? (collab ? collaboratorDisplayName(collab) : null) ?? null,
    assignee_hub: matched?.hub ?? null,
  };
}

export async function todoistFetchCollaborators(
  projectId: string,
): Promise<TodoistCollaborator[]> {
  return todoistFetchAll<TodoistCollaborator>(`/projects/${projectId}/collaborators`, {
    limit: 200,
  });
}

/** Requisição simples (ex.: close/reopen/get by id). */
export async function todoistFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return todoistJson<T>(path, init);
}

// --- Projects ---

export async function todoistFetchProjects(): Promise<TodoistProject[]> {
  return todoistFetchAll<TodoistProject>('/projects', { limit: 200 });
}

export async function todoistGetProject(projectId: string): Promise<TodoistProject> {
  return todoistFetch<TodoistProject>(`/projects/${projectId}`);
}

export async function todoistCreateProject(name: string): Promise<TodoistProject> {
  return todoistFetch<TodoistProject>('/projects', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function todoistUpdateProject(
  projectId: string,
  data: { name?: string; description?: string; color?: string },
): Promise<TodoistProject> {
  return todoistFetch<TodoistProject>(`/projects/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function todoistDeleteProject(projectId: string): Promise<null> {
  return todoistFetch<null>(`/projects/${projectId}`, { method: 'DELETE' });
}

export async function todoistArchiveProject(projectId: string): Promise<TodoistProject> {
  return todoistFetch<TodoistProject>(`/projects/${projectId}/archive`, { method: 'POST' });
}

export async function todoistUnarchiveProject(projectId: string): Promise<TodoistProject> {
  return todoistFetch<TodoistProject>(`/projects/${projectId}/unarchive`, { method: 'POST' });
}

// --- Sections ---

export async function todoistFetchSections(projectId?: string): Promise<TodoistSection[]> {
  const query = projectId ? { project_id: projectId } : {};
  return todoistFetchAll<TodoistSection>('/sections', { ...query, limit: 200 });
}

export async function todoistGetSection(sectionId: string): Promise<TodoistSection> {
  return todoistFetch<TodoistSection>(`/sections/${sectionId}`);
}

export async function todoistCreateSection(
  name: string,
  projectId: string,
): Promise<TodoistSection> {
  return todoistFetch<TodoistSection>('/sections', {
    method: 'POST',
    body: JSON.stringify({ name, project_id: projectId }),
  });
}

export async function todoistUpdateSection(
  sectionId: string,
  data: { name?: string; section_order?: number },
): Promise<TodoistSection> {
  return todoistFetch<TodoistSection>(`/sections/${sectionId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function todoistDeleteSection(sectionId: string): Promise<null> {
  return todoistFetch<null>(`/sections/${sectionId}`, { method: 'DELETE' });
}

// --- Labels ---

export async function todoistFetchLabels(): Promise<TodoistLabel[]> {
  return todoistFetchAll<TodoistLabel>('/labels', { limit: 200 });
}

export async function todoistGetLabel(labelId: string): Promise<TodoistLabel> {
  return todoistFetch<TodoistLabel>(`/labels/${labelId}`);
}

export async function todoistCreateLabel(name: string): Promise<TodoistLabel> {
  return todoistFetch<TodoistLabel>('/labels', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function todoistUpdateLabel(
  labelId: string,
  data: { name?: string; color?: string },
): Promise<TodoistLabel> {
  return todoistFetch<TodoistLabel>(`/labels/${labelId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function todoistDeleteLabel(labelId: string): Promise<null> {
  return todoistFetch<null>(`/labels/${labelId}`, { method: 'DELETE' });
}

// --- Comments ---

export async function todoistFetchComments(opts: {
  taskId?: string;
  projectId?: string;
}): Promise<TodoistComment[]> {
  const query: Record<string, string | undefined> = {};
  if (opts.taskId) query.task_id = opts.taskId;
  if (opts.projectId) query.project_id = opts.projectId;
  return todoistFetchAll<TodoistComment>('/comments', { ...query, limit: 200 });
}

export async function todoistGetComment(commentId: string): Promise<TodoistComment> {
  return todoistFetch<TodoistComment>(`/comments/${commentId}`);
}

export async function todoistCreateComment(data: {
  content: string;
  task_id?: string;
  project_id?: string;
}): Promise<TodoistComment> {
  return todoistFetch<TodoistComment>('/comments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function todoistUpdateComment(
  commentId: string,
  content: string,
): Promise<TodoistComment> {
  return todoistFetch<TodoistComment>(`/comments/${commentId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function todoistDeleteComment(commentId: string): Promise<null> {
  return todoistFetch<null>(`/comments/${commentId}`, { method: 'DELETE' });
}

// --- Tasks ---

export async function todoistGetTask(taskId: string): Promise<TodoistTaskRaw> {
  const raw = await todoistFetch<TodoistTaskV1>(`/tasks/${taskId}`);
  let collaborators: TodoistCollaborator[] = [];
  if (raw.project_id) {
    try {
      collaborators = await todoistFetchCollaborators(raw.project_id);
    } catch {
      collaborators = [];
    }
  }
  return mapTodoistTask(raw, undefined, collaborators);
}

export async function todoistCreateTask(data: CreateTaskInput): Promise<TodoistTaskRaw> {
  const raw = await todoistFetch<TodoistTaskV1>('/tasks', {
    method: 'POST',
    body: JSON.stringify(buildTaskWriteBody(data)),
  });
  let collaborators: TodoistCollaborator[] = [];
  if (raw.project_id) {
    try {
      collaborators = await todoistFetchCollaborators(raw.project_id);
    } catch {
      collaborators = [];
    }
  }
  return mapTodoistTask(raw, false, collaborators);
}

export async function todoistUpdateTask(
  taskId: string,
  data: UpdateTaskInput,
): Promise<TodoistTaskRaw> {
  const { section_id, ...updateFields } = data;
  const writeBody = buildTaskWriteBody(updateFields);
  if (Object.keys(writeBody).length > 0) {
    await todoistFetch<TodoistTaskV1>(`/tasks/${taskId}`, {
      method: 'POST',
      body: JSON.stringify(writeBody),
    });
  }
  if (section_id !== undefined) {
    await todoistMoveTask(taskId, { section_id });
  }
  return todoistGetTask(taskId);
}

export async function todoistDeleteTask(taskId: string): Promise<null> {
  return todoistFetch<null>(`/tasks/${taskId}`, { method: 'DELETE' });
}

export async function todoistCloseTask(taskId: string): Promise<null> {
  return todoistFetch<null>(`/tasks/${taskId}/close`, { method: 'POST' });
}

export async function todoistReopenTask(taskId: string): Promise<null> {
  return todoistFetch<null>(`/tasks/${taskId}/reopen`, { method: 'POST' });
}

export async function todoistMoveTask(taskId: string, data: MoveTaskInput): Promise<TodoistTaskRaw> {
  const raw = await todoistFetch<TodoistTaskV1>(`/tasks/${taskId}/move`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return mapTodoistTask(raw);
}

export interface QuickAddTaskInput {
  text: string;
  note?: string;
  /** Garante projeto mesmo sem # no texto */
  project_id?: string;
  /** Move para a seção após criar, se o parser não aplicar */
  section_id?: string;
}

export async function todoistQuickAddTask(input: QuickAddTaskInput): Promise<TodoistTaskV1> {
  let text = input.text.trim();
  if (!text) throw new Error('Texto da tarefa obrigatório');

  if (input.project_id && !/#/.test(text)) {
    try {
      const project = await todoistGetProject(input.project_id);
      if (project?.name) {
        const token = project.name.includes(' ')
          ? `#${project.name.replace(/\\/g, '\\\\').replace(/ /g, '\\ ')}`
          : `#${project.name}`;
        text = `${text} ${token}`;
      }
    } catch {
      /* segue sem hashtag se projeto não resolver */
    }
  }

  const raw = await todoistFetch<TodoistTaskV1>('/tasks/quick', {
    method: 'POST',
    body: JSON.stringify({
      text,
      ...(input.note ? { note: input.note } : {}),
    }),
  });

  if (input.section_id && raw.section_id !== input.section_id) {
    return todoistFetch<TodoistTaskV1>(`/tasks/${raw.id}/move`, {
      method: 'POST',
      body: JSON.stringify({ section_id: input.section_id }),
    });
  }

  return raw;
}

export async function todoistFilterTasks(
  query: string,
  lang?: string,
  collaborators: TodoistCollaborator[] = [],
): Promise<TodoistTaskRaw[]> {
  const items = await todoistFetchAll<TodoistTaskV1>('/tasks/filter', {
    query,
    ...(lang ? { lang } : {}),
    limit: 200,
  });
  return items.map((t) => mapTodoistTask(t, false, collaborators));
}

function buildCompletedRangeQuery(
  projectId?: string,
  sectionId?: string,
  days = 30,
): Record<string, string | number | undefined> {
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + 1);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const completedQuery: Record<string, string | number | undefined> = {
    since: since.toISOString(),
    until: until.toISOString(),
    limit: 200,
  };
  if (projectId) completedQuery.project_id = projectId;
  if (sectionId) completedQuery.section_id = sectionId;
  return completedQuery;
}

export async function todoistFetchTasks(
  opts?: {
    projectId?: string;
    sectionId?: string;
    label?: string;
    filterQuery?: string;
    filterLang?: string;
    /** Busca concluídas (padrão: só ativas — bem mais rápido). */
    includeCompleted?: boolean;
    /** Apenas tarefas concluídas (carregamento sob demanda). */
    completedOnly?: boolean;
    completedDays?: number;
  },
  collaborators: TodoistCollaborator[] = [],
): Promise<TodoistTaskRaw[]> {
  if (opts?.filterQuery) {
    return todoistFilterTasks(opts.filterQuery, opts.filterLang ?? 'pt', collaborators);
  }

  const query: Record<string, string | number | undefined> = { limit: 200 };
  if (opts?.projectId) query.project_id = opts.projectId;
  if (opts?.sectionId) query.section_id = opts.sectionId;
  if (opts?.label) query.label = opts.label;

  const completedDays = opts?.completedDays ?? 30;

  if (opts?.completedOnly) {
    const completed = await todoistFetchAll<TodoistTaskV1>(
      '/tasks/completed/by_completion_date',
      buildCompletedRangeQuery(opts.projectId, opts.sectionId, completedDays),
    );
    return completed.map((t) => mapTodoistTask(t, true, collaborators));
  }

  const activePromise = todoistFetchAll<TodoistTaskV1>('/tasks', query);

  if (!opts?.includeCompleted) {
    const active = await activePromise;
    return active.map((t) => mapTodoistTask(t, false, collaborators));
  }

  const [active, completed] = await Promise.all([
    activePromise,
    todoistFetchAll<TodoistTaskV1>(
      '/tasks/completed/by_completion_date',
      buildCompletedRangeQuery(opts.projectId, opts.sectionId, completedDays),
    ),
  ]);

  const activeMapped = active.map((t) => mapTodoistTask(t, false, collaborators));
  const completedMapped = completed.map((t) => mapTodoistTask(t, true, collaborators));

  const byId = new Map<string, TodoistTaskRaw>();
  for (const t of [...activeMapped, ...completedMapped]) {
    byId.set(t.id, t);
  }
  return [...byId.values()];
}
