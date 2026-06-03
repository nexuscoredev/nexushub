import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ProjectSelector } from '../components/ProjectSelector';
import * as todoistApi from '../lib/todoistApi';
import type { AssigneeHub, AssigneeOption } from '../lib/todoistAssignees';
import { TEAM_ASSIGNEES } from '../lib/todoistAssignees';
import { matchProjectToSystem, sortProjectsByClient } from '../lib/systemLogos';
import type {
  TodoistComment,
  TodoistLabel,
  TodoistProject,
  TodoistSection,
  TodoistTask,
} from '../types/todoist';
import styles from './FilaPage.module.css';

const PROJECT_STORAGE_KEY = 'nexushub-todoist-project';

type ViewTab = 'tasks' | 'manage';
type QuickFilter = '' | 'today' | 'tomorrow' | 'overdue' | 'p1';
type DuePreset = '' | 'today' | 'tomorrow';

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: '', label: 'Todas' },
  { id: 'today', label: 'Hoje' },
  { id: 'tomorrow', label: 'Amanhã' },
  { id: 'overdue', label: 'Atrasadas' },
  { id: 'p1', label: 'Urgentes' },
];

const DUE_PRESETS: { id: DuePreset; label: string }[] = [
  { id: '', label: 'Sem prazo' },
  { id: 'today', label: 'Hoje' },
  { id: 'tomorrow', label: 'Amanhã' },
];

const PRIORITIES = [
  { value: 1, label: 'P1', title: 'Urgente' },
  { value: 2, label: 'P2', title: 'Alta' },
  { value: 3, label: 'P3', title: 'Média' },
  { value: 4, label: 'P4', title: 'Normal' },
] as const;

const COMMENT_PRESETS = ['Ok', 'Em andamento', 'Bloqueado', 'Precisa revisão'];

function pickProjectId(list: TodoistProject[], preferred?: string): string {
  if (preferred && list.some((p) => p.id === preferred)) return preferred;
  const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
  if (stored && list.some((p) => p.id === stored)) return stored;
  const sorted = sortProjectsByClient(list);
  const firstClient = sorted.find((p) => matchProjectToSystem(p.name));
  return firstClient?.id ?? sorted[0]?.id ?? '';
}

function priorityClass(priority: number): string {
  if (priority === 1) return styles.p1;
  if (priority === 2) return styles.p2;
  if (priority === 3) return styles.p3;
  return styles.p4;
}

function formatDue(task: TodoistTask): string | null {
  if (task.due?.string) return task.due.string;
  if (task.due?.date) return task.due.date;
  if (task.due?.datetime) return task.due.datetime;
  return null;
}

function filterQueryFor(id: QuickFilter): string | undefined {
  if (!id) return undefined;
  if (id === 'p1') return 'p1';
  return id;
}

interface ChipProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}

function Chip({ active, disabled, onClick, children, title }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface TaskRowProps {
  task: TodoistTask;
  sectionName?: string;
  selected: boolean;
  onSelect: (task: TodoistTask) => void;
  onToggle: (task: TodoistTask) => void;
}

function TaskRow({ task, sectionName, selected, onSelect, onToggle }: TaskRowProps) {
  const due = formatDue(task);
  return (
    <li
      className={`${styles.taskItem} ${task.is_completed ? styles.taskDone : ''} ${selected ? styles.taskItemSelected : ''}`}
    >
      <input
        type="checkbox"
        checked={task.is_completed}
        onChange={(e) => {
          e.stopPropagation();
          void onToggle(task);
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label={task.is_completed ? `Reabrir ${task.content}` : `Concluir ${task.content}`}
      />
      <span className={`${styles.priority} ${priorityClass(task.priority)}`} aria-hidden />
      <div
        className={styles.taskBody}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(task)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(task);
          }
        }}
      >
        <div className={`${styles.taskTitle} ${task.is_completed ? styles.taskDoneText : ''}`}>
          {task.content}
          {(task.note_count ?? 0) > 0 && (
            <span className={styles.noteCount}>{task.note_count} coment.</span>
          )}
        </div>
        <div className={styles.taskMeta}>
          {task.assignee_name && (
            <span className={styles.assigneeChip}>{task.assignee_name}</span>
          )}
          {due && <small className={styles.taskDue}>{due}</small>}
          {sectionName && <span className={styles.sectionChip}>{sectionName}</span>}
          {(task.labels ?? []).map((l) => (
            <span key={l} className={styles.labelChip}>
              @{l}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}

export function FilaPage() {
  const [viewTab, setViewTab] = useState<ViewTab>('tasks');
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [projects, setProjects] = useState<TodoistProject[]>([]);
  const [sections, setSections] = useState<TodoistSection[]>([]);
  const [labels, setLabels] = useState<TodoistLabel[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectName, setProjectName] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TodoistTask | null>(null);
  const [comments, setComments] = useState<TodoistComment[]>([]);
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newDue, setNewDue] = useState<DuePreset>('');
  const [newPriority, setNewPriority] = useState(4);
  const [newSectionId, setNewSectionId] = useState('');
  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [newAssigneeHub, setNewAssigneeHub] = useState<AssigneeHub | ''>('');
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>(
    TEAM_ASSIGNEES.map((t) => ({ ...t, assignee_id: null, uid: null })),
  );

  const sectionMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sections) map.set(s.id, s.name);
    return map;
  }, [sections]);

  const loadMeta = useCallback(async (projectId: string) => {
    const [sectionsData, labelsData] = await Promise.all([
      todoistApi.fetchSections(projectId),
      todoistApi.fetchLabels(),
    ]);
    setSections(sectionsData);
    setLabels(labelsData);
  }, []);

  const loadTasks = useCallback(
    async (projectId: string, opts?: { sectionId?: string; label?: string; filterQuery?: string }) => {
      const data = await todoistApi.fetchTasks({
        projectId: opts?.filterQuery ? undefined : projectId,
        sectionId: opts?.sectionId,
        label: opts?.label,
        filterQuery: opts?.filterQuery,
      });
      setTasks(data.tasks);
      setAssigneeOptions(
        data.assigneeOptions.length
          ? data.assigneeOptions
          : TEAM_ASSIGNEES.map((t) => ({ ...t, assignee_id: null, uid: null })),
      );
      setProjectName(data.projectName);
      const resolvedId = data.projectId ?? projectId;
      if (resolvedId) {
        setSelectedProjectId(resolvedId);
        localStorage.setItem(PROJECT_STORAGE_KEY, resolvedId);
      }
      return data;
    },
    [],
  );

  const refresh = useCallback(
    async (projectId?: string) => {
      setLoading(true);
      setError(null);
      try {
        let list = projects;
        if (list.length === 0) {
          list = await todoistApi.fetchProjects();
          setProjects(list);
        }

        const id = pickProjectId(list, projectId ?? selectedProjectId);
        const filterQ = filterQueryFor(quickFilter);

        if (!id && !filterQ) {
          setTasks([]);
          return;
        }

        if (id) await loadMeta(id);
        await loadTasks(id, {
          sectionId: sectionFilter || undefined,
          label: labelFilter || undefined,
          filterQuery: filterQ,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar fila');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    },
    [labelFilter, loadMeta, loadTasks, projects, quickFilter, sectionFilter, selectedProjectId],
  );

  const skipFilterRefresh = useRef(true);

  useEffect(() => {
    void refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skipFilterRefresh.current) {
      skipFilterRefresh.current = false;
      return;
    }
    if (projects.length === 0) return;
    void refresh(selectedProjectId);
  }, [sectionFilter, labelFilter, quickFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadComments = useCallback(async (taskId: string) => {
    try {
      setComments(await todoistApi.fetchComments(taskId));
    } catch {
      setComments([]);
    }
  }, []);

  const selectTask = useCallback(
    async (task: TodoistTask) => {
      setSelectedTask(task);
      setTitleDraft(task.content);
      setRenamingTitle(false);
      await loadComments(task.id);
    },
    [loadComments],
  );

  const handleProjectChange = (projectId: string) => {
    setSectionFilter('');
    setQuickFilter('');
    void refresh(projectId);
  };

  const resetNewTask = () => {
    setNewTaskTitle('');
    setNewDue('');
    setNewPriority(4);
    setNewSectionId('');
    setNewLabels([]);
    setNewAssigneeHub('');
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const assignee = newAssigneeHub
      ? assigneeOptions.find((o) => o.hub === newAssigneeHub)
      : undefined;
    try {
      setError(null);
      await todoistApi.createTask({
        content: newTaskTitle.trim(),
        project_id: selectedProjectId,
        section_id: newSectionId || undefined,
        labels: newLabels.length ? newLabels : undefined,
        priority: newPriority,
        due_string: newDue === 'today' ? 'today' : newDue === 'tomorrow' ? 'tomorrow' : undefined,
        assignee_id: assignee?.assignee_id ?? undefined,
      });
      resetNewTask();
      await refresh(selectedProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar');
    }
  };

  const toggleTask = async (task: TodoistTask) => {
    try {
      setError(null);
      await todoistApi.updateTask(task.id, { is_completed: !task.is_completed });
      if (selectedTask?.id === task.id) {
        setSelectedTask({ ...task, is_completed: !task.is_completed });
      }
      await refresh(selectedProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  };

  const patchSelected = async (patch: Parameters<typeof todoistApi.updateTask>[1]) => {
    if (!selectedTask) return;
    try {
      setError(null);
      const updated = await todoistApi.updateTask(selectedTask.id, patch);
      setSelectedTask(updated);
      await refresh(selectedProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const saveTitle = async () => {
    if (!selectedTask || !titleDraft.trim()) return;
    await patchSelected({ content: titleDraft.trim() });
    setRenamingTitle(false);
  };

  const deleteSelectedTask = async () => {
    if (!selectedTask) return;
    if (!window.confirm(`Excluir tarefa "${selectedTask.content}"?`)) return;
    try {
      setError(null);
      await todoistApi.deleteTask(selectedTask.id);
      setSelectedTask(null);
      setComments([]);
      await refresh(selectedProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  };

  const addComment = async (text: string) => {
    if (!selectedTask || !text.trim()) return;
    try {
      setError(null);
      await todoistApi.createComment(selectedTask.id, text.trim());
      await loadComments(selectedTask.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comentar');
    }
  };

  const promptCreate = async (kind: 'project' | 'section' | 'label') => {
    const labels: Record<typeof kind, string> = {
      project: 'Nome do novo projeto',
      section: 'Nome da nova seção',
      label: 'Nome da nova etiqueta',
    };
    const name = window.prompt(labels[kind]);
    if (!name?.trim()) return;
    try {
      setError(null);
      if (kind === 'project') {
        await todoistApi.createProject(name.trim());
        setProjects(await todoistApi.fetchProjects());
      } else if (kind === 'section') {
        if (!selectedProjectId) return;
        await todoistApi.createSection(name.trim(), selectedProjectId);
        await loadMeta(selectedProjectId);
      } else {
        await todoistApi.createLabel(name.trim());
        setLabels(await todoistApi.fetchLabels());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar');
    }
  };

  const toggleNewLabel = (name: string) => {
    setNewLabels((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name],
    );
  };

  const toggleSelectedLabel = async (name: string) => {
    if (!selectedTask) return;
    const current = selectedTask.labels ?? [];
    const next = current.includes(name)
      ? current.filter((l) => l !== name)
      : [...current, name];
    await patchSelected({ labels: next });
  };

  const pending = tasks.filter((t) => !t.is_completed);
  const done = tasks.filter((t) => t.is_completed);

  return (
    <div>
      <PageHeader
        badge="Ops"
        title="Fila operacional"
        subtitle={projectName ? `Projeto: ${projectName}` : 'Tarefas da equipe via Todoist'}
        actions={
          <>
            <button type="button" className="btn-ghost" onClick={() => void refresh()}>
              Atualizar
            </button>
            <a
              href="https://todoist.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              Abrir Todoist
            </a>
          </>
        }
      />

      <div className={styles.tabs}>
        <button
          type="button"
          className={`tab ${viewTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setViewTab('tasks')}
        >
          Tarefas
        </button>
        <button
          type="button"
          className={`tab ${viewTab === 'manage' ? 'active' : ''}`}
          onClick={() => setViewTab('manage')}
        >
          Gerenciar
        </button>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {viewTab === 'tasks' && (
        <>
          <div className={`card ${styles.addBar}`}>
            <div className={styles.addRow}>
              <input
                className={`input ${styles.addInput}`}
                placeholder="Nova tarefa…"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleAddTask();
                }}
              />
              <button
                type="button"
                className="btn-primary"
                disabled={!newTaskTitle.trim()}
                onClick={() => void handleAddTask()}
              >
                Adicionar
              </button>
            </div>
            <div className={styles.chipRow}>
              <span className={styles.chipGroupLabel}>Prazo</span>
              {DUE_PRESETS.map((d) => (
                <Chip key={d.id || 'none'} active={newDue === d.id} onClick={() => setNewDue(d.id)}>
                  {d.label}
                </Chip>
              ))}
            </div>
            <div className={styles.chipRow}>
              <span className={styles.chipGroupLabel}>Prioridade</span>
              {PRIORITIES.map((p) => (
                <Chip
                  key={p.value}
                  active={newPriority === p.value}
                  onClick={() => setNewPriority(p.value)}
                  title={p.title}
                >
                  {p.label}
                </Chip>
              ))}
            </div>
            <div className={styles.chipRow}>
              <span className={styles.chipGroupLabel}>Responsável</span>
              <Chip active={!newAssigneeHub} onClick={() => setNewAssigneeHub('')}>
                Ninguém
              </Chip>
              {assigneeOptions.map((o) => (
                <Chip
                  key={o.hub}
                  active={newAssigneeHub === o.hub}
                  onClick={() => setNewAssigneeHub(o.hub)}
                  title={`Todoist: ${o.todoistName}`}
                  disabled={!o.assignee_id}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
            {sections.length > 0 && (
              <div className={styles.chipRow}>
                <span className={styles.chipGroupLabel}>Seção</span>
                <Chip active={!newSectionId} onClick={() => setNewSectionId('')}>
                  Nenhuma
                </Chip>
                {sections.map((s) => (
                  <Chip
                    key={s.id}
                    active={newSectionId === s.id}
                    onClick={() => setNewSectionId(s.id)}
                  >
                    {s.name}
                  </Chip>
                ))}
              </div>
            )}
            {labels.length > 0 && (
              <div className={styles.chipRow}>
                <span className={styles.chipGroupLabel}>Etiquetas</span>
                {labels.map((l) => (
                  <Chip
                    key={l.id}
                    active={newLabels.includes(l.name)}
                    onClick={() => toggleNewLabel(l.name)}
                  >
                    @{l.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          <div className={styles.filters}>
            {projects.length > 0 && (
              <ProjectSelector
                projects={projects}
                value={selectedProjectId}
                onChange={handleProjectChange}
                disabled={loading || Boolean(quickFilter)}
              />
            )}
            <div className={styles.chipRow}>
              {QUICK_FILTERS.map((f) => (
                <Chip
                  key={f.id || 'all'}
                  active={quickFilter === f.id}
                  onClick={() => setQuickFilter(f.id)}
                >
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>

          {sections.length > 0 && !quickFilter && (
            <div className={styles.chipRow} style={{ marginBottom: '0.75rem' }}>
              <span className={styles.chipGroupLabel}>Filtrar seção</span>
              <Chip active={!sectionFilter} onClick={() => setSectionFilter('')}>
                Todas
              </Chip>
              {sections.map((s) => (
                <Chip
                  key={s.id}
                  active={sectionFilter === s.id}
                  onClick={() => setSectionFilter(s.id)}
                >
                  {s.name}
                </Chip>
              ))}
            </div>
          )}

          {labels.length > 0 && !quickFilter && (
            <div className={styles.chipRow} style={{ marginBottom: '1rem' }}>
              <span className={styles.chipGroupLabel}>Filtrar etiqueta</span>
              <Chip active={!labelFilter} onClick={() => setLabelFilter('')}>
                Todas
              </Chip>
              {labels.map((l) => (
                <Chip
                  key={l.id}
                  active={labelFilter === l.name}
                  onClick={() => setLabelFilter(labelFilter === l.name ? '' : l.name)}
                >
                  @{l.name}
                </Chip>
              ))}
            </div>
          )}

          {loading && <p style={{ color: 'var(--muted)' }}>Carregando tarefas…</p>}

          <div className={`${styles.layout} ${selectedTask ? styles.layoutWithDetail : ''}`}>
            <div className={styles.grid}>
              <section className="card">
                <h2 className={styles.sectionTitle}>Pendentes ({pending.length})</h2>
                <ul className={styles.taskList}>
                  {pending.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      sectionName={t.section_id ? sectionMap.get(t.section_id) : undefined}
                      selected={selectedTask?.id === t.id}
                      onSelect={(task) => void selectTask(task)}
                      onToggle={toggleTask}
                    />
                  ))}
                  {!loading && pending.length === 0 && (
                    <li className={styles.empty}>Nenhuma tarefa pendente.</li>
                  )}
                </ul>
              </section>
              <section className="card">
                <h2 className={styles.sectionTitle}>Concluídas ({done.length})</h2>
                <ul className={styles.taskList}>
                  {done.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      sectionName={t.section_id ? sectionMap.get(t.section_id) : undefined}
                      selected={selectedTask?.id === t.id}
                      onSelect={(task) => void selectTask(task)}
                      onToggle={toggleTask}
                    />
                  ))}
                  {!loading && done.length === 0 && (
                    <li className={styles.empty}>Nenhuma tarefa concluída recente.</li>
                  )}
                </ul>
              </section>
            </div>

            {selectedTask && (
              <aside className={`card ${styles.detailPanel}`}>
                <div className={styles.detailHeader}>
                  {renamingTitle ? (
                    <div className={styles.renameRow}>
                      <input
                        className="input"
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void saveTitle();
                          if (e.key === 'Escape') setRenamingTitle(false);
                        }}
                        autoFocus
                      />
                      <button type="button" className="btn-primary" onClick={() => void saveTitle()}>
                        Ok
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className={styles.detailTitle}>{selectedTask.content}</h2>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        onClick={() => setRenamingTitle(true)}
                      >
                        Renomear
                      </button>
                    </>
                  )}
                </div>

                <div className={styles.actionGroup}>
                  <span className={styles.chipGroupLabel}>Prioridade</span>
                  <div className={styles.chipRow}>
                    {PRIORITIES.map((p) => (
                      <Chip
                        key={p.value}
                        active={selectedTask.priority === p.value}
                        onClick={() => void patchSelected({ priority: p.value })}
                        title={p.title}
                      >
                        {p.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className={styles.actionGroup}>
                  <span className={styles.chipGroupLabel}>Prazo</span>
                  <div className={styles.chipRow}>
                    {DUE_PRESETS.map((d) => (
                      <Chip
                        key={d.id || 'none'}
                        active={
                          d.id === ''
                            ? !selectedTask.due
                            : d.id === 'today'
                              ? selectedTask.due?.string === 'today' ||
                                selectedTask.due?.date === new Date().toISOString().slice(0, 10)
                              : selectedTask.due?.string === 'tomorrow'
                        }
                        onClick={() =>
                          void patchSelected({
                            due_string:
                              d.id === 'today' ? 'today' : d.id === 'tomorrow' ? 'tomorrow' : '',
                          })
                        }
                      >
                        {d.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className={styles.actionGroup}>
                  <span className={styles.chipGroupLabel}>Responsável</span>
                  <div className={styles.chipRow}>
                    <Chip
                      active={!selectedTask.assignee_hub}
                      onClick={() => void patchSelected({ assignee_id: null })}
                    >
                      Ninguém
                    </Chip>
                    {assigneeOptions.map((o) => (
                      <Chip
                        key={o.hub}
                        active={selectedTask.assignee_hub === o.hub}
                        onClick={() => void patchSelected({ assignee_id: o.assignee_id })}
                        title={`Todoist: ${o.todoistName}`}
                        disabled={!o.assignee_id}
                      >
                        {o.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                {sections.length > 0 && (
                  <div className={styles.actionGroup}>
                    <span className={styles.chipGroupLabel}>Seção</span>
                    <div className={styles.chipRow}>
                      <Chip
                        active={!selectedTask.section_id}
                        onClick={() => void patchSelected({ section_id: '' })}
                      >
                        Nenhuma
                      </Chip>
                      {sections.map((s) => (
                        <Chip
                          key={s.id}
                          active={selectedTask.section_id === s.id}
                          onClick={() => void patchSelected({ section_id: s.id })}
                        >
                          {s.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {labels.length > 0 && (
                  <div className={styles.actionGroup}>
                    <span className={styles.chipGroupLabel}>Etiquetas</span>
                    <div className={styles.chipRow}>
                      {labels.map((l) => (
                        <Chip
                          key={l.id}
                          active={(selectedTask.labels ?? []).includes(l.name)}
                          onClick={() => void toggleSelectedLabel(l.name)}
                        >
                          @{l.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.detailActions}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => void toggleTask(selectedTask)}
                  >
                    {selectedTask.is_completed ? 'Reabrir' : 'Concluir'}
                  </button>
                  <a
                    href={selectedTask.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    Todoist
                  </a>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => void deleteSelectedTask()}
                  >
                    Excluir
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setSelectedTask(null)}>
                    Fechar
                  </button>
                </div>

                <div className={styles.comments}>
                  <h3 className={styles.sectionTitle}>Comentários</h3>
                  <ul className={styles.commentList}>
                    {comments.map((c) => (
                      <li key={c.id} className={styles.commentItem}>
                        {c.content}
                        {c.posted_at && (
                          <span className={styles.commentDate}>
                            {new Date(c.posted_at).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </li>
                    ))}
                    {comments.length === 0 && (
                      <li className={styles.empty}>Nenhum comentário.</li>
                    )}
                  </ul>
                  <div className={styles.chipRow}>
                    {COMMENT_PRESETS.map((preset) => (
                      <Chip key={preset} onClick={() => void addComment(preset)}>
                        {preset}
                      </Chip>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </>
      )}

      {viewTab === 'manage' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className={styles.manageActions}>
            <button type="button" className="btn-primary" onClick={() => void promptCreate('project')}>
              + Novo projeto
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!selectedProjectId}
              onClick={() => void promptCreate('section')}
            >
              + Nova seção
            </button>
            <button type="button" className="btn-primary" onClick={() => void promptCreate('label')}>
              + Nova etiqueta
            </button>
          </div>

          <div className={styles.manageSection}>
            <h3>Projetos</h3>
            <ul className={styles.manageList}>
              {projects.map((p) => (
                <li key={p.id} className={styles.manageItem}>
                  <span>{p.name}</span>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => {
                      if (window.confirm(`Excluir projeto "${p.name}"?`)) {
                        void todoistApi.deleteProject(p.id).then(() => refresh());
                      }
                    }}
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.manageSection}>
            <h3>Seções — {projectName ?? 'projeto'}</h3>
            <ul className={styles.manageList}>
              {sections.map((s) => (
                <li key={s.id} className={styles.manageItem}>
                  <span>{s.name}</span>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => {
                      if (window.confirm(`Excluir seção "${s.name}"?`)) {
                        void todoistApi.deleteSection(s.id).then(() => loadMeta(selectedProjectId));
                      }
                    }}
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.manageSection}>
            <h3>Etiquetas</h3>
            <ul className={styles.manageList}>
              {labels.map((l) => (
                <li key={l.id} className={styles.manageItem}>
                  <span>@{l.name}</span>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => {
                      if (window.confirm(`Excluir etiqueta "${l.name}"?`)) {
                        void todoistApi.deleteLabel(l.id).then(() =>
                          todoistApi.fetchLabels().then(setLabels),
                        );
                      }
                    }}
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
