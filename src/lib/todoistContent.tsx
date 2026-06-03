import type { ReactNode } from 'react';
import type { TodoistTask } from '../types/todoist';

type SegmentType = 'text' | 'bold' | 'italic' | 'boldItalic' | 'strike';

interface MarkdownSegment {
  type: SegmentType;
  text: string;
}

/** Inline markdown do Todoist em títulos de tarefa (**, *, ***, ~~). */
export function parseTodoistMarkdown(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let i = 0;
  const s = content;

  while (i < s.length) {
    let matched = false;

    if (s.startsWith('***', i)) {
      const end = s.indexOf('***', i + 3);
      if (end !== -1) {
        segments.push({ type: 'boldItalic', text: s.slice(i + 3, end) });
        i = end + 3;
        matched = true;
      }
    }

    if (!matched && s.startsWith('**', i)) {
      const end = s.indexOf('**', i + 2);
      if (end !== -1) {
        segments.push({ type: 'bold', text: s.slice(i + 2, end) });
        i = end + 2;
        matched = true;
      }
    }

    if (!matched && s.startsWith('~~', i)) {
      const end = s.indexOf('~~', i + 2);
      if (end !== -1) {
        segments.push({ type: 'strike', text: s.slice(i + 2, end) });
        i = end + 2;
        matched = true;
      }
    }

    if (!matched && s[i] === '*' && s[i + 1] !== '*') {
      const end = s.indexOf('*', i + 1);
      if (end !== -1 && end > i + 1) {
        segments.push({ type: 'italic', text: s.slice(i + 1, end) });
        i = end + 1;
        matched = true;
      }
    }

    if (!matched) {
      let j = i + 1;
      while (j < s.length) {
        const ch = s[j];
        if (ch === '*' || s.startsWith('~~', j)) break;
        j++;
      }
      segments.push({ type: 'text', text: s.slice(i, j) });
      i = j;
    }
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', text: content });
  }

  return segments;
}

export function isTodoistHeadingContent(content: string): boolean {
  const t = content.trim();
  return /^\*\*\*[\s\S]+?\*\*\*$/.test(t) || /^\*\*[\s\S]+?\*\*$/.test(t);
}

interface TodoistTaskContentProps {
  content: string;
  className?: string;
  asHeading?: boolean;
}

export function TodoistTaskContent({ content, className, asHeading }: TodoistTaskContentProps) {
  const segments = parseTodoistMarkdown(content);
  const heading = asHeading ?? isTodoistHeadingContent(content);

  const nodes: ReactNode[] = segments.map((seg, idx) => {
    switch (seg.type) {
      case 'boldItalic':
        return (
          <strong key={idx}>
            <em>{seg.text}</em>
          </strong>
        );
      case 'bold':
        return <strong key={idx}>{seg.text}</strong>;
      case 'italic':
        return <em key={idx}>{seg.text}</em>;
      case 'strike':
        return <s key={idx}>{seg.text}</s>;
      default:
        return <span key={idx}>{seg.text}</span>;
    }
  });

  if (heading) {
    return <span className={className}>{nodes}</span>;
  }

  return <span className={className}>{nodes}</span>;
}

export interface TaskDisplayItem {
  task: TodoistTask;
  depth: number;
}

function compareTaskOrder(a: TodoistTask, b: TodoistTask): number {
  const orderDiff = (a.order ?? 0) - (b.order ?? 0);
  if (orderDiff !== 0) return orderDiff;
  return a.content.localeCompare(b.content, 'pt-BR');
}

/** IDs de tarefas que possuem subtarefas na lista atual. */
export function getParentIdsWithChildren(tasks: TodoistTask[]): Set<string> {
  const ids = new Set(tasks.map((t) => t.id));
  const parents = new Set<string>();
  for (const task of tasks) {
    if (task.parent_id && ids.has(task.parent_id)) {
      parents.add(task.parent_id);
    }
  }
  return parents;
}

/** Oculta subtarefas quando algum ancestral está recolhido. */
export function filterCollapsedTasks(
  items: TaskDisplayItem[],
  tasks: TodoistTask[],
  collapsed: ReadonlySet<string>,
): TaskDisplayItem[] {
  if (collapsed.size === 0) return items;

  const idSet = new Set(tasks.map((t) => t.id));
  const parentById = new Map(tasks.map((t) => [t.id, t.parent_id ?? null]));

  function isHidden(taskId: string): boolean {
    let parentId = parentById.get(taskId) ?? null;
    while (parentId && idSet.has(parentId)) {
      if (collapsed.has(parentId)) return true;
      parentId = parentById.get(parentId) ?? null;
    }
    return false;
  }

  return items.filter(({ task }) => !isHidden(task.id));
}

/** Conta descendentes diretos + indiretos visíveis na árvore. */
export function countDescendants(taskId: string, tasks: TodoistTask[]): number {
  const byParent = new Map<string, TodoistTask[]>();
  for (const task of tasks) {
    const pid = task.parent_id;
    if (!pid) continue;
    const list = byParent.get(pid) ?? [];
    list.push(task);
    byParent.set(pid, list);
  }
  let count = 0;
  function walk(id: string) {
    for (const child of byParent.get(id) ?? []) {
      count++;
      walk(child.id);
    }
  }
  walk(taskId);
  return count;
}

/** Ordena tarefas como no Todoist: pais primeiro, subtarefas aninhadas por parent_id. */
export function buildTodoistTaskDisplayList(
  tasks: TodoistTask[],
  compare: (a: TodoistTask, b: TodoistTask) => number = compareTaskOrder,
): TaskDisplayItem[] {
  if (tasks.length === 0) return [];

  const idSet = new Set(tasks.map((t) => t.id));
  const byParent = new Map<string | null, TodoistTask[]>();

  for (const task of tasks) {
    let parentId = task.parent_id ?? null;
    while (parentId && !idSet.has(parentId)) {
      parentId = null;
      break;
    }
    const list = byParent.get(parentId) ?? [];
    list.push(task);
    byParent.set(parentId, list);
  }

  for (const list of byParent.values()) {
    list.sort(compare);
  }

  const result: TaskDisplayItem[] = [];

  function walk(parentId: string | null, depth: number) {
    for (const task of byParent.get(parentId) ?? []) {
      result.push({ task, depth });
      walk(task.id, depth + 1);
    }
  }

  walk(null, 0);
  return result;
}

/** Texto plano para aria-label / busca (sem markdown). */
export function todoistPlainText(content: string): string {
  return parseTodoistMarkdown(content)
    .map((s) => s.text)
    .join('');
}
