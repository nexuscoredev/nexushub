import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { NavIcon } from './NavIcon';
import { ProjectSelector } from './ProjectSelector';
import type { AssigneeHub, AssigneeOption } from '../lib/todoistAssignees';
import { TEAM_ASSIGNEES } from '../lib/todoistAssignees';
import * as todoistApi from '../lib/todoistApi';
import type { TodoistLabel, TodoistProject, TodoistSection } from '../types/todoist';
import styles from './CreateTaskModal.module.css';

type DuePreset = '' | 'today' | 'tomorrow';

const DUE_PRESETS: { id: DuePreset; label: string }[] = [
  { id: '', label: 'Sem prazo' },
  { id: 'today', label: 'Hoje' },
  { id: 'tomorrow', label: 'Amanhã' },
];

const PRIORITIES = [
  { value: 1, label: 'P1', title: 'Urgente (vermelho)' },
  { value: 2, label: 'P2', title: 'Alta (amarelo)' },
  { value: 3, label: 'P3', title: 'Média (verde)' },
  { value: 4, label: 'P4', title: 'Baixa (cinza)' },
] as const;

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projects: TodoistProject[];
  labels: TodoistLabel[];
  defaultProjectId: string;
  onCreated: (projectId: string) => void;
}

function defaultAssigneeOptions(): AssigneeOption[] {
  return TEAM_ASSIGNEES.map((t) => ({ ...t, assignee_id: null, uid: null }));
}

interface ModalChipProps {
  active?: boolean;
  unavailable?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  priorityTone?: 1 | 2 | 3 | 4;
}

const PRIORITY_CHIP_CLASS: Record<
  1 | 2 | 3 | 4,
  { base: string; active: string }
> = {
  1: { base: styles.chipPriority1, active: styles.chipPriority1Active },
  2: { base: styles.chipPriority2, active: styles.chipPriority2Active },
  3: { base: styles.chipPriority3, active: styles.chipPriority3Active },
  4: { base: styles.chipPriority4, active: styles.chipPriority4Active },
};

function ModalChip({
  active,
  unavailable,
  onClick,
  children,
  title,
  priorityTone,
}: ModalChipProps) {
  const priority =
    priorityTone !== undefined ? PRIORITY_CHIP_CLASS[priorityTone] : null;
  return (
    <button
      type="button"
      className={[
        styles.chip,
        priority?.base,
        active && (priority ? priority.active : styles.chipActive),
        unavailable ? styles.chipUnavailable : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      title={title}
      disabled={unavailable}
    >
      {children}
    </button>
  );
}

export function CreateTaskModal({
  open,
  onClose,
  projects,
  labels,
  defaultProjectId,
  onCreated,
}: CreateTaskModalProps) {
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState<DuePreset>('');
  const [priority, setPriority] = useState(4);
  const [sectionId, setSectionId] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [assigneeHub, setAssigneeHub] = useState<AssigneeHub | ''>('');
  const [sections, setSections] = useState<TodoistSection[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>(defaultAssigneeOptions);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setDue('');
    setPriority(4);
    setSectionId('');
    setSelectedLabels([]);
    setAssigneeHub('');
    setError(null);
  }, []);

  const loadProjectMeta = useCallback(async (pid: string) => {
    if (!pid) return;
    setLoadingMeta(true);
    try {
      const [sectionsData, taskMeta] = await Promise.all([
        todoistApi.fetchSections(pid),
        todoistApi.fetchTasks({ projectId: pid }),
      ]);
      setSections(sectionsData);
      setAssigneeOptions(
        taskMeta.assigneeOptions.length ? taskMeta.assigneeOptions : defaultAssigneeOptions(),
      );
    } catch {
      setSections([]);
      setAssigneeOptions(defaultAssigneeOptions());
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    resetForm();
    setProjectId(defaultProjectId);
  }, [open, defaultProjectId, resetForm]);

  useEffect(() => {
    if (!open || !projectId) return;
    void loadProjectMeta(projectId);
  }, [open, projectId, loadProjectMeta]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleProjectChange = (pid: string) => {
    setProjectId(pid);
    setSectionId('');
    setAssigneeHub('');
  };

  const toggleLabel = (name: string) => {
    setSelectedLabels((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name],
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Informe o título da tarefa.');
      return;
    }
    if (!projectId) {
      setError('Selecione um cliente.');
      return;
    }
    const assignee = assigneeHub ? assigneeOptions.find((o) => o.hub === assigneeHub) : undefined;
    if (assigneeHub && !assignee?.uid && assignee?.assignee_id == null) {
      setError(
        `${assignee?.label ?? 'Responsável'} não está no projeto Todoist. Compartilhe o projeto com a equipe ou escolha outro responsável.`,
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await todoistApi.createTask({
        content: title.trim(),
        project_id: projectId,
        section_id: sectionId || undefined,
        labels: selectedLabels.length ? selectedLabels : undefined,
        priority,
        due_string: due === 'today' ? 'today' : due === 'tomorrow' ? 'tomorrow' : undefined,
        assignee_id: assignee?.uid ?? assignee?.assignee_id ?? undefined,
      });
      onCreated(projectId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const selectedAssignee = assigneeHub
    ? assigneeOptions.find((o) => o.hub === assigneeHub)
    : undefined;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="create-task-title">
        <div className={styles.header}>
          <h2 id="create-task-title" className={styles.title}>
            Nova tarefa
          </h2>
          <button type="button" className={`btn-ghost ${styles.closeBtn}`} onClick={onClose} aria-label="Fechar">
            <NavIcon name="close" />
          </button>
        </div>

        <div className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {projects.length > 0 && (
            <ProjectSelector
              projects={projects}
              value={projectId}
              onChange={handleProjectChange}
              disabled={loadingMeta || submitting}
            />
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="create-task-title-input">
              Título
            </label>
            <input
              id="create-task-title-input"
              className="input"
              placeholder="O que precisa ser feito?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSubmit();
              }}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Prioridade</span>
            <div className={styles.chipRow}>
              {PRIORITIES.map((p) => (
                <ModalChip
                  key={p.value}
                  priorityTone={p.value}
                  active={priority === p.value}
                  onClick={() => setPriority(p.value)}
                  title={p.title}
                >
                  {p.label}
                </ModalChip>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Prazo</span>
            <div className={styles.chipRow}>
              {DUE_PRESETS.map((d) => (
                <ModalChip key={d.id || 'none'} active={due === d.id} onClick={() => setDue(d.id)}>
                  {d.label}
                </ModalChip>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Responsável</span>
            <div className={styles.chipRow}>
              <ModalChip active={!assigneeHub} onClick={() => setAssigneeHub('')}>
                Ninguém
              </ModalChip>
              {assigneeOptions.map((o) => (
                <ModalChip
                  key={o.hub}
                  active={assigneeHub === o.hub}
                  unavailable={!o.uid && o.assignee_id == null}
                  onClick={() => setAssigneeHub(o.hub)}
                  title={
                    o.uid || o.assignee_id != null
                      ? `Todoist: ${o.todoistName}`
                      : `${o.label} — não encontrado neste projeto`
                  }
                >
                  {o.label}
                </ModalChip>
              ))}
            </div>
            {assigneeHub && !selectedAssignee?.uid && selectedAssignee?.assignee_id == null && (
              <p className={`${styles.hint} ${styles.hintWarn}`}>
                Compartilhe este projeto no Todoist com {selectedAssignee?.label} para poder atribuir.
              </p>
            )}
          </div>

          {sections.length > 0 && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Seção</span>
              <div className={styles.chipRow}>
                <ModalChip active={!sectionId} onClick={() => setSectionId('')}>
                  Nenhuma
                </ModalChip>
                {sections.map((s) => (
                  <ModalChip
                    key={s.id}
                    active={sectionId === s.id}
                    onClick={() => setSectionId(s.id)}
                  >
                    {s.name}
                  </ModalChip>
                ))}
              </div>
            </div>
          )}

          {labels.length > 0 && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Etiquetas</span>
              <div className={styles.chipRow}>
                {labels.map((l) => (
                  <ModalChip
                    key={l.id}
                    active={selectedLabels.includes(l.name)}
                    onClick={() => toggleLabel(l.name)}
                  >
                    @{l.name}
                  </ModalChip>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void handleSubmit()}
              disabled={submitting || !title.trim()}
            >
              {submitting ? 'Criando…' : 'Criar tarefa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
