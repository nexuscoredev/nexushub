import { normalizeUsuario } from './usuarios';

export type AssigneeHub = 'felipe' | 'vinicius' | 'rafael';

export interface TeamAssignee {
  hub: AssigneeHub;
  todoistName: string;
  label: string;
}

export const TEAM_ASSIGNEES: TeamAssignee[] = [
  { hub: 'felipe', todoistName: 'FEELP', label: 'Felipe' },
  { hub: 'vinicius', todoistName: 'Vinícius de Morais', label: 'Vinícius' },
  { hub: 'rafael', todoistName: 'RafSC RSC', label: 'Rafael' },
];

const ASSIGNEE_NAME_TOKENS: Record<AssigneeHub, string[]> = {
  felipe: ['feelp', 'felipe'],
  vinicius: ['vinicius', 'vinícius', 'morais', 'vinicius de morais'],
  rafael: ['rafsc', 'rafael', 'raf sc'],
};

export interface AssigneeOption extends TeamAssignee {
  assignee_id: number | null;
  uid: string | null;
}

export function hubFromUsuario(usuario: string | null | undefined): AssigneeHub | null {
  const u = normalizeUsuario(usuario);
  if (u === 'felipe' || u === 'vinicius' || u === 'rafael') return u;
  return null;
}

function nameMatchesAssignee(assigneeName: string, hub: AssigneeHub, option?: AssigneeOption): boolean {
  const n = assigneeName.trim().toLowerCase();
  if (!n) return false;
  const tokens = new Set<string>();
  const team = TEAM_ASSIGNEES.find((t) => t.hub === hub);
  if (team) {
    tokens.add(team.label.toLowerCase());
    tokens.add(team.todoistName.toLowerCase());
  }
  if (option) {
    tokens.add(option.label.toLowerCase());
    tokens.add(option.todoistName.toLowerCase());
  }
  for (const t of ASSIGNEE_NAME_TOKENS[hub]) tokens.add(t);
  for (const token of tokens) {
    if (n === token || n.includes(token) || token.includes(n)) return true;
  }
  return false;
}

/** Tarefa atribuída ao membro da equipe (hub = usuario do login). */
export function taskIsAssignedToHub(
  task: {
    assignee_hub?: string | null;
    assignee_name?: string | null;
    responsible_uid?: string | null;
  },
  hub: AssigneeHub,
  options: AssigneeOption[] = [],
): boolean {
  if (task.assignee_hub === hub) return true;
  const mine = options.find((o) => o.hub === hub);
  if (mine?.uid && task.responsible_uid && mine.uid === task.responsible_uid) return true;
  if (task.assignee_name && nameMatchesAssignee(task.assignee_name, hub, mine)) return true;
  return false;
}
