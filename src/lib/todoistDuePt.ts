import type { TodoistDue } from '../types/todoist';
import { formatDate } from './format';

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

  if (due.string) {
    const key = due.string.trim().toLowerCase();
    const exact = DUE_STRING_EXACT[key];
    if (exact) return exact;
    return translateDueStringHeuristic(due.string);
  }

  if (due.datetime) {
    try {
      return new Date(due.datetime).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return due.datetime;
    }
  }

  if (due.date) {
    return formatDate(due.date);
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
  if (preset === '') return !task.due?.date && !task.due?.datetime && !task.due?.string;
  const s = normalizeDueString(task.due?.string);
  const todayIso = new Date().toISOString().slice(0, 10);
  if (preset === 'today') {
    return (
      s === 'today' ||
      s === 'hoje' ||
      task.due?.date === todayIso
    );
  }
  if (preset === 'tomorrow') {
    return s === 'tomorrow' || s === 'amanha' || s === 'amanhã';
  }
  return false;
}
