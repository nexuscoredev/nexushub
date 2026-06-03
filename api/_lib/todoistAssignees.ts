export interface TeamAssignee {
  hub: 'felipe' | 'vinicius' | 'rafael';
  todoistName: string;
  label: string;
}

export const TEAM_ASSIGNEES: TeamAssignee[] = [
  { hub: 'felipe', todoistName: 'FEELP', label: 'Felipe' },
  { hub: 'vinicius', todoistName: 'Vinícius de Morais', label: 'Vinícius' },
  { hub: 'rafael', todoistName: 'RafSC RSC', label: 'Rafael' },
];

export interface TodoistCollaborator {
  id: string;
  full_name?: string;
  name?: string;
  email?: string;
}

export interface AssigneeOption extends TeamAssignee {
  assignee_id: number | null;
  uid: string | null;
}

export function collaboratorDisplayName(c: TodoistCollaborator): string {
  return (c.full_name ?? c.name ?? c.email ?? '').trim();
}

function namesMatch(todoistFullName: string | undefined | null, expected: string): boolean {
  if (!todoistFullName) return false;
  const a = todoistFullName.trim().toLowerCase();
  const b = expected.trim().toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

export function buildAssigneeOptions(collaborators: TodoistCollaborator[]): AssigneeOption[] {
  return TEAM_ASSIGNEES.map((team) => {
    const collab = collaborators.find((c) =>
      namesMatch(collaboratorDisplayName(c), team.todoistName),
    );
    const id = collab?.id ?? null;
    return {
      ...team,
      uid: id,
      assignee_id: id ? Number(id) : null,
    };
  });
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
