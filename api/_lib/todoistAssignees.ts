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
  full_name: string;
  email?: string;
}

export interface AssigneeOption extends TeamAssignee {
  assignee_id: number | null;
  uid: string | null;
}

function namesMatch(todoistFullName: string, expected: string): boolean {
  const a = todoistFullName.trim().toLowerCase();
  const b = expected.trim().toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

export function buildAssigneeOptions(collaborators: TodoistCollaborator[]): AssigneeOption[] {
  return TEAM_ASSIGNEES.map((team) => {
    const collab = collaborators.find((c) => namesMatch(c.full_name, team.todoistName));
    const id = collab?.id;
    return {
      ...team,
      uid: id ?? null,
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
  const team = TEAM_ASSIGNEES.find((t) => namesMatch(collab.full_name, t.todoistName));
  return team?.label ?? collab.full_name;
}

export function assigneeIdForHub(
  hub: TeamAssignee['hub'],
  options: AssigneeOption[],
): number | null {
  return options.find((o) => o.hub === hub)?.assignee_id ?? null;
}
