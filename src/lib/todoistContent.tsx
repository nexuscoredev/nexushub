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

/** Ordena tarefas como no Todoist: pais primeiro, subtarefas aninhadas por parent_id. */
export function buildTodoistTaskDisplayList(tasks: TodoistTask[]): TaskDisplayItem[] {
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
    list.sort(compareTaskOrder);
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
