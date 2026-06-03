export interface TeamAssignee {
  hub: 'felipe' | 'vinicius' | 'rafael';
  todoistName: string;
  label: string;
  /** Tokens extras para casar nome/e-mail no Todoist */
  matchTokens: string[];
}

export const TEAM_ASSIGNEES: TeamAssignee[] = [
  {
    hub: 'felipe',
    todoistName: 'FEELP',
    label: 'Felipe',
    matchTokens: ['feelp', 'felipe'],
  },
  {
    hub: 'vinicius',
    todoistName: 'Vinícius de Morais',
    label: 'Vinícius',
    matchTokens: ['vinicius', 'vinícius', 'morais', 'de morais'],
  },
  {
    hub: 'rafael',
    todoistName: 'RafSC RSC',
    label: 'Rafael',
    matchTokens: ['rafsc', 'rafael', 'raf sc'],
  },
];

export interface TodoistCollaborator {
  id?: string;
  user_id?: string;
  full_name?: string;
  name?: string;
  email?: string;
}

export interface AssigneeOption extends TeamAssignee {
  /** ID numérico do usuário no Todoist (quando disponível) */
  assignee_id: number | null;
  /** UID string (responsible_uid) — usado na API quando o ID é string */
  uid: string | null;
}

export function collaboratorDisplayName(c: TodoistCollaborator): string {
  return (c.full_name ?? c.name ?? c.email ?? '').trim();
}

export function collaboratorUid(c: TodoistCollaborator): string | null {
  const raw = c.id ?? c.user_id;
  if (raw == null || String(raw).trim() === '') return null;
  return String(raw).trim();
}

function namesMatch(todoistFullName: string | undefined | null, expected: string): boolean {
  if (!todoistFullName) return false;
  const a = todoistFullName.trim().toLowerCase();
  const b = expected.trim().toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

function collaboratorMatchesTeam(c: TodoistCollaborator, team: TeamAssignee): boolean {
  const display = collaboratorDisplayName(c);
  const email = (c.email ?? '').trim().toLowerCase();
  const tokens = [team.todoistName, team.label, ...team.matchTokens];
  return tokens.some((token) => {
    const t = token.trim().toLowerCase();
    if (!t) return false;
    if (namesMatch(display, t)) return true;
    if (email && (email.includes(t) || t.includes(email.split('@')[0] ?? ''))) return true;
    return false;
  });
}

export function buildAssigneeOptions(collaborators: TodoistCollaborator[]): AssigneeOption[] {
  return TEAM_ASSIGNEES.map((team) => {
    const collab = collaborators.find((c) => collaboratorMatchesTeam(c, team));
    const uid = collab ? collaboratorUid(collab) : null;
    const assignee_id = uid && /^\d+$/.test(uid) ? Number(uid) : null;
    return {
      ...team,
      uid,
      assignee_id,
    };
  });
}

/** Campos aceitos pelo POST/PATCH de tarefas na API v1 */
export function assigneeFieldsForTodoistApi(
  assignee_id: number | string | null | undefined,
): Record<string, unknown> {
  if (assignee_id === undefined) return {};
  if (assignee_id === null) {
    return { assignee_id: null, responsible_uid: '' };
  }
  const uid = String(assignee_id).trim();
  if (!uid) return { assignee_id: null, responsible_uid: '' };
  const out: Record<string, unknown> = { responsible_uid: uid };
  if (/^\d+$/.test(uid)) out.assignee_id = Number(uid);
  return out;
}

export function hubLabelFromUid(
  uid: string | null | undefined,
  collaborators: TodoistCollaborator[],
): string | null {
  if (!uid) return null;
  const collab = collaborators.find((c) => c.id === uid);
  if (!collab) return null;
  const team = TEAM_ASSIGNEES.find((t) =>
    namesMatch(collaboratorDisplayName(collab), t.todoistName),
  );
  return team?.label ?? collaboratorDisplayName(collab) ?? null;
}

export function assigneeIdForHub(
  hub: TeamAssignee['hub'],
  options: AssigneeOption[],
): number | null {
  return options.find((o) => o.hub === hub)?.assignee_id ?? null;
}
