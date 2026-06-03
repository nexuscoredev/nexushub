import { todoistPlainText } from './todoistContent';
import type { TodoistTask } from '../types/todoist';

export type FilaTaskSortMode =
  | 'default'
  | 'priority'
  | 'alphabetical'
  | 'dueDate'
  | 'assignee'
  | 'section';

export const FILA_TASK_SORT_STORAGE_KEY = 'nexushub-fila-sort';

export const FILA_TASK_SORT_OPTIONS: { id: FilaTaskSortMode; label: string; title: string }[] = [
  { id: 'default', label: 'Padrão', title: 'Ordem do Todoist' },
  { id: 'priority', label: 'Prioridade', title: 'P1 (urgente) primeiro' },
  { id: 'alphabetical', label: 'A–Z', title: 'Ordem alfabética pelo título' },
  { id: 'dueDate', label: 'Data', title: 'Prazo mais próximo primeiro' },
  { id: 'assignee', label: 'Responsável', title: 'Por nome do responsável' },
  { id: 'section', label: 'Seção', title: 'Por seção do projeto' },
];

export function isFilaTaskSortMode(value: string | null | undefined): value is FilaTaskSortMode {
  return FILA_TASK_SORT_OPTIONS.some((o) => o.id === value);
}

function defaultTaskOrder(a: TodoistTask, b: TodoistTask): number {
  const orderDiff = (a.order ?? 0) - (b.order ?? 0);
  if (orderDiff !== 0) return orderDiff;
  return a.content.localeCompare(b.content, 'pt-BR');
}

function dueSortKey(task: TodoistTask): number {
  const iso = task.due?.date ?? task.due?.datetime?.slice(0, 10);
  if (!iso) return Number.MAX_SAFE_INTEGER;
  const t = new Date(`${iso}T12:00:00`).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function assigneeSortKey(task: TodoistTask): string {
  return (task.assignee_name ?? task.assignee_hub ?? 'zzz').trim().toLowerCase();
}

export function compareFilaTasks(
  a: TodoistTask,
  b: TodoistTask,
  mode: FilaTaskSortMode,
  sectionNames: Map<string, string>,
): number {
  switch (mode) {
    case 'priority': {
      const diff = a.priority - b.priority;
      return diff !== 0 ? diff : defaultTaskOrder(a, b);
    }
    case 'alphabetical': {
      const diff = todoistPlainText(a.content).localeCompare(todoistPlainText(b.content), 'pt-BR', {
        sensitivity: 'base',
      });
      return diff !== 0 ? diff : defaultTaskOrder(a, b);
    }
    case 'dueDate': {
      const diff = dueSortKey(a) - dueSortKey(b);
      return diff !== 0 ? diff : defaultTaskOrder(a, b);
    }
    case 'assignee': {
      const diff = assigneeSortKey(a).localeCompare(assigneeSortKey(b), 'pt-BR', {
        sensitivity: 'base',
      });
      return diff !== 0 ? diff : defaultTaskOrder(a, b);
    }
    case 'section': {
      const sa = a.section_id ? sectionNames.get(a.section_id) ?? 'zzz' : 'zzz';
      const sb = b.section_id ? sectionNames.get(b.section_id) ?? 'zzz' : 'zzz';
      const diff = sa.localeCompare(sb, 'pt-BR', { sensitivity: 'base' });
      return diff !== 0 ? diff : defaultTaskOrder(a, b);
    }
    default:
      return defaultTaskOrder(a, b);
  }
}

export function getFilaTaskCompare(
  mode: FilaTaskSortMode,
  sectionNames: Map<string, string>,
): (a: TodoistTask, b: TodoistTask) => number {
  if (mode === 'default') return defaultTaskOrder;
  return (a, b) => compareFilaTasks(a, b, mode, sectionNames);
}
