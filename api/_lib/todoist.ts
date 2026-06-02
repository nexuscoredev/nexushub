const TODOIST_BASE = 'https://api.todoist.com/rest/v2';

export function getTodoistToken(): string | undefined {
  return process.env.TODOIST_API_TOKEN;
}

export async function todoistFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getTodoistToken();
  if (!token) throw new Error('TODOIST_API_TOKEN não configurado');

  const res = await fetch(`${TODOIST_BASE}${path}`, {
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

  return res.json() as Promise<T>;
}

export interface TodoistProject {
  id: string;
  name: string;
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
