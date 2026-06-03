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

export interface AssigneeOption extends TeamAssignee {
  assignee_id: number | null;
  uid: string | null;
}
