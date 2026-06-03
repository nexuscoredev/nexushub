/** Monta linha no formato Quick Add do Todoist (mesmo motor do app). */

import { isoDateToTodoistDuePt } from './todoistDuePt';

export function escapeQuickAddToken(name: string): string {
  return name.replace(/\\/g, '\\\\').replace(/ /g, '\\ ');
}

export function quickAddProjectToken(projectName: string): string {
  return `#${escapeQuickAddToken(projectName)}`;
}

export interface QuickAddExtras {
  projectName?: string;
  sectionName?: string;
  labels?: string[];
  /** Prioridade Hub P1=1 … P4=4 (vira p1…p4 no texto). */
  priorityHub?: number;
  duePreset?: '' | 'today' | 'tomorrow';
  /** YYYY-MM-DD — prazo específico (Quick Add em português). */
  dueDateIso?: string;
  assigneeTodoistName?: string;
}

export function buildQuickAddText(title: string, extras: QuickAddExtras = {}): string {
  const t = title.trim();
  if (!t) return '';

  const parts: string[] = [t];

  if (extras.projectName && !/#/.test(t)) {
    parts.push(quickAddProjectToken(extras.projectName));
  }

  if (extras.sectionName && !/\//.test(t)) {
    parts.push(`/${escapeQuickAddToken(extras.sectionName)}`);
  }

  for (const label of extras.labels ?? []) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`@${escaped}`, 'i').test(t)) {
      parts.push(`@${label}`);
    }
  }

  const hubP = extras.priorityHub;
  if (
    hubP != null &&
    hubP >= 1 &&
    hubP <= 4 &&
    !/\bp[1-4]\b/i.test(t) &&
    !/!![1-4]/.test(t)
  ) {
    parts.push(`p${hubP}`);
  }

  if (extras.duePreset === 'today' && !/\b(hoje|today)\b/i.test(t)) {
    parts.push('hoje');
  }
  if (extras.duePreset === 'tomorrow' && !/\b(amanhã|amanha|tomorrow)\b/i.test(t)) {
    parts.push('amanhã');
  }

  if (extras.dueDateIso && !extras.duePreset) {
    const dueText = isoDateToTodoistDuePt(extras.dueDateIso);
    const duePattern = new RegExp(
      dueText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );
    if (!duePattern.test(t) && !/\bdia \d+/i.test(t)) {
      parts.push(dueText);
    }
  }

  if (extras.assigneeTodoistName && !/\+/.test(t)) {
    parts.push(`+${escapeQuickAddToken(extras.assigneeTodoistName)}`);
  }

  return parts.join(' ');
}
