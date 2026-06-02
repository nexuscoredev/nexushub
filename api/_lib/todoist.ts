const TODOIST_BASE = 'https://api.todoist.com/api/v1';

export function getTodoistToken(): string | undefined {
  return process.env.TODOIST_API_TOKEN;
}

interface PaginatedResponse<T> {
  results?: T[];
  items?: T[];
  next_cursor?: string | null;
}

export interface TodoistProject {
  id: string;
  name: string;
}

export interface TodoistTaskV1 {
  id: string;
  content: string;
  description?: string;
  checked?: boolean;
  due?: { date?: string; datetime?: string };
  priority: number;
  project_id: string;
  completed_at?: string | null;
}

export interface TodoistTaskRaw {
  id: string;
  content: string;
  description: string;
  is_completed: boolean;
  due?: { date?: string; datetime?: string };
  priority: number;
  url: string;
  project_id: string;
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

async function todoistFetchAll<T>(
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

export function mapTodoistTask(task: TodoistTaskV1, isCompleted?: boolean): TodoistTaskRaw {
  const completed = isCompleted ?? Boolean(task.checked) || Boolean(task.completed_at);
  return {
    id: task.id,
    content: task.content,
    description: task.description ?? '',
    is_completed: completed,
    due: task.due,
    priority: task.priority,
    url: `https://todoist.com/showTask?id=${task.id}`,
    project_id: task.project_id,
  };
}

export async function todoistFetchProjects(): Promise<TodoistProject[]> {
  return todoistFetchAll<TodoistProject>('/projects', { limit: 200 });
}

export async function todoistFetchTasks(projectId?: string): Promise<TodoistTaskRaw[]> {
  const query = projectId ? { project_id: projectId } : {};
  const active = await todoistFetchAll<TodoistTaskV1>('/tasks', { ...query, limit: 200 });
  const activeMapped = active.map((t) => mapTodoistTask(t, false));

  const until = new Date();
  until.setUTCDate(until.getUTCDate() + 1);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 90);

  const completedQuery: Record<string, string | number | undefined> = {
    since: since.toISOString(),
    until: until.toISOString(),
    limit: 200,
    ...(projectId ? { project_id: projectId } : {}),
  };

  const completed = await todoistFetchAll<TodoistTaskV1>(
    '/tasks/completed/by_completion_date',
    completedQuery,
  );
  const completedMapped = completed.map((t) => mapTodoistTask(t, true));

  const byId = new Map<string, TodoistTaskRaw>();
  for (const t of [...activeMapped, ...completedMapped]) {
    byId.set(t.id, t);
  }
  return [...byId.values()];
}

/** Requisição simples (ex.: close/reopen/get by id). */
export async function todoistFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return todoistJson<T>(path, init);
}
