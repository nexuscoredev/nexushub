import type { TodoistDue } from '../types/todoist';
import { formatDate } from './format';

/** Data local YYYY-MM-DD (evita drift de timezone UTC). */
function localTodayIso(): string {
  return toLocalIsoDate(new Date());
}

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isoDateOffset(baseIso: string, days: number): string {
  const d = new Date(`${baseIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalIsoDate(d);
}

function extractDueDateIso(due: TodoistDue): string | null {
  if (due.date) return due.date.slice(0, 10);
  if (due.datetime) return due.datetime.slice(0, 10);
  return null;
}

/** Rótulo relativo a partir da data real do prazo (não do texto estático do Todoist). */
function relativeDueLabelFromIso(dateIso: string): 'Hoje' | 'Amanhã' | 'Ontem' | null {
  const today = localTodayIso();
  if (dateIso === today) return 'Hoje';
  if (dateIso === isoDateOffset(today, 1)) return 'Amanhã';
  if (dateIso === isoDateOffset(today, -1)) return 'Ontem';
  return null;
}

function formatDueDateTime(due: TodoistDue): string | null {
  if (!due.datetime) return null;
  const dateIso = due.datetime.slice(0, 10);
  const relative = relativeDueLabelFromIso(dateIso);
  if (relative) {
    const hasTime = /T\d{2}:\d{2}/.test(due.datetime) && !due.datetime.includes('T00:00:00');
    if (hasTime) {
      const time = new Date(due.datetime).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${relative}, ${time}`;
    }
    return relative;
  }
  try {
    return new Date(due.datetime).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return due.datetime;
  }
}

/** Valores exatos retornados pelo Todoist em `due.string` (inglês e português). */
const DUE_STRING_EXACT: Record<string, string> = {
  today: 'Hoje',
  hoje: 'Hoje',
  tomorrow: 'Amanhã',
  amanha: 'Amanhã',
  amanhã: 'Amanhã',
  yesterday: 'Ontem',
  ontem: 'Ontem',
  'no date': 'Sem prazo',
  'no deadline': 'Sem prazo',
  overdue: 'Atrasado',
  atrasado: 'Atrasado',
  atrasada: 'Atrasada',
};

const DUE_WORD_PT: [RegExp, string][] = [
  [/\btoday\b/gi, 'hoje'],
  [/\btomorrow\b/gi, 'amanhã'],
  [/\byesterday\b/gi, 'ontem'],
  [/\bevery day\b/gi, 'todo dia'],
  [/\bevery week\b/gi, 'toda semana'],
  [/\bevery month\b/gi, 'todo mês'],
  [/\bevery year\b/gi, 'todo ano'],
  [/\bevery\b/gi, 'a cada'],
  [/\bmonday\b/gi, 'segunda-feira'],
  [/\btuesday\b/gi, 'terça-feira'],
  [/\bwednesday\b/gi, 'quarta-feira'],
  [/\bthursday\b/gi, 'quinta-feira'],
  [/\bfriday\b/gi, 'sexta-feira'],
  [/\bsaturday\b/gi, 'sábado'],
  [/\bsunday\b/gi, 'domingo'],
  [/\bjan\b/gi, 'jan'],
  [/\bfeb\b/gi, 'fev'],
  [/\bmar\b/gi, 'mar'],
  [/\bapr\b/gi, 'abr'],
  [/\bmay\b/gi, 'mai'],
  [/\bjun\b/gi, 'jun'],
  [/\bjul\b/gi, 'jul'],
  [/\baug\b/gi, 'ago'],
  [/\bsep\b/gi, 'set'],
  [/\boct\b/gi, 'out'],
  [/\bnov\b/gi, 'nov'],
  [/\bdec\b/gi, 'dez'],
  [/\bin\b/gi, 'em'],
  [/\bdays?\b/gi, 'dias'],
  [/\bweeks?\b/gi, 'semanas'],
];

function translateDueStringHeuristic(raw: string): string {
  let out = raw.trim();
  for (const [pattern, replacement] of DUE_WORD_PT) {
    out = out.replace(pattern, replacement);
  }
  if (out.length > 0) {
    return out.charAt(0).toUpperCase() + out.slice(1);
  }
  return raw;
}

/** Exibe prazo da tarefa em português (lista, modal, etc.). */
export function formatTodoistDueDisplay(due?: TodoistDue | null): string | null {
  if (!due) return null;

  const dateIso = extractDueDateIso(due);
  if (dateIso) {
    const relative = relativeDueLabelFromIso(dateIso);
    if (relative) return relative;
    if (due.datetime) return formatDueDateTime(due);
    return formatDate(dateIso);
  }

  if (due.datetime) return formatDueDateTime(due);

  if (due.string) {
    const key = due.string.trim().toLowerCase();
    const exact = DUE_STRING_EXACT[key];
    if (exact) return exact;
    return translateDueStringHeuristic(due.string);
  }

  return null;
}

export type TodoistDuePreset = '' | 'today' | 'tomorrow';

/** Corpo para criar/atualizar prazo na API (português + due_lang). */
export function todoistDuePresetToApi(
  preset: TodoistDuePreset,
): { due_string?: string; due_lang?: string } {
  if (preset === 'today') return { due_string: 'hoje', due_lang: 'pt' };
  if (preset === 'tomorrow') return { due_string: 'amanhã', due_lang: 'pt' };
  return { due_string: '', due_lang: 'pt' };
}

/** Para criação de tarefa: omitir prazo quando não houver preset. */
export function todoistDuePresetForCreate(
  preset: TodoistDuePreset,
): { due_string?: string; due_lang?: string } {
  if (!preset) return {};
  return todoistDuePresetToApi(preset);
}

function normalizeDueString(s: string | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

/** Tarefa corresponde ao preset de prazo do Hub (Hoje / Amanhã / Sem prazo). */
export function taskMatchesDuePreset(task: { due?: TodoistDue | null }, preset: TodoistDuePreset): boolean {
  const due = task.due;
  if (preset === '') {
    return !due?.date && !due?.datetime && !due?.string;
  }

  const dateIso = due ? extractDueDateIso(due) : null;
  const todayIso = localTodayIso();
  const tomorrowIso = isoDateOffset(todayIso, 1);
  const s = normalizeDueString(due?.string);

  if (preset === 'today') {
    if (dateIso === todayIso) return true;
    return s === 'today' || s === 'hoje';
  }
  if (preset === 'tomorrow') {
    if (dateIso === tomorrowIso) return true;
    return s === 'tomorrow' || s === 'amanha' || s === 'amanhã';
  }
  return false;
}
