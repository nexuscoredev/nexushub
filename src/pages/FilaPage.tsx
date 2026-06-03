import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import * as todoistApi from '../lib/todoistApi';
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

function pickProjectId(list: TodoistProject[], preferred?: string): string {
  if (preferred && list.some((p) => p.id === preferred)) return preferred;
  const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
  if (stored && list.some((p) => p.id === stored)) return stored;
  return list[0]?.id ?? '';
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
  const [filterQuery, setFilterQuery] = useState('');
  const [appliedFilterQuery, setAppliedFilterQuery] = useState('');
  const [quickAddText, setQuickAddText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoistTask | null>(null);
  const [comments, setComments] = useState<TodoistComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [manageOpen, setManageOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    content: '',
    description: '',
    due_date: '',
    priority: 4,
    section_id: '',
    labels: [] as string[],
  });

  const [editForm, setEditForm] = useState({
    content: '',
    description: '',
    due_date: '',
    priority: 4,
    section_id: '',
    labels: [] as string[],
  });

  const [newProjectName, setNewProjectName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [newLabelName, setNewLabelName] = useState('');

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
        if (!id && !appliedFilterQuery) {
          setTasks([]);
          return;
        }

        if (id) await loadMeta(id);
        await loadTasks(id, {
          sectionId: sectionFilter || undefined,
          label: labelFilter || undefined,
          filterQuery: appliedFilterQuery || undefined,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar fila');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    },
    [
      appliedFilterQuery,
      labelFilter,
      loadMeta,
      loadTasks,
      projects,
      sectionFilter,
      selectedProjectId,
    ],
  );

  useEffect(() => {
    void refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadComments = useCallback(async (taskId: string) => {
    try {
      const list = await todoistApi.fetchComments(taskId);
      setComments(list);
    } catch {
      setComments([]);
    }
  }, []);

  const selectTask = useCallback(
    async (task: TodoistTask) => {
      setSelectedTask(task);
      setEditForm({
        content: task.content,
        description: task.description ?? '',
        due_date: task.due?.date ?? '',
        priority: task.priority,
        section_id: task.section_id ?? '',
        labels: task.labels ?? [],
      });
      await loadComments(task.id);
    },
    [loadComments],
  );

  const handleProjectChange = (projectId: string) => {
    setSectionFilter('');
    setAppliedFilterQuery('');
    setFilterQuery('');
    void refresh(projectId);
  };

  const applyFilters = () => {
    setAppliedFilterQuery(filterQuery.trim());
    void refresh(selectedProjectId);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;
    try {
      setError(null);
      await todoistApi.quickAddTask(quickAddText.trim());
      setQuickAddText('');
      await refresh(selectedProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.content.trim()) return;
    try {
      setError(null);
      await todoistApi.createTask({
        content: createForm.content.trim(),
        description: createForm.description.trim() || undefined,
        project_id: selectedProjectId,
        section_id: createForm.section_id || undefined,
        labels: createForm.labels.length ? createForm.labels : undefined,
        priority: createForm.priority,
        due_date: createForm.due_date || undefined,
      });
      setCreateForm({
        content: '',
        description: '',
        due_date: '',
        priority: 4,
        section_id: '',
        labels: [],
      });
      setShowCreateForm(false);
      await refresh(selectedProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa');
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

  const saveTaskEdit = async () => {
    if (!selectedTask) return;
    try {
      setError(null);
      const updated = await todoistApi.updateTask(selectedTask.id, {
        content: editForm.content.trim(),
        description: editForm.description.trim(),
        due_date: editForm.due_date || undefined,
        priority: editForm.priority,
        section_id: editForm.section_id || undefined,
        labels: editForm.labels,
      });
      setSelectedTask(updated);
      await refresh(selectedProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
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

  const addComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    try {
      setError(null);
      await todoistApi.createComment(selectedTask.id, newComment.trim());
      setNewComment('');
      await loadComments(selectedTask.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comentar');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      setError(null);
      await todoistApi.createProject(newProjectName.trim());
      setNewProjectName('');
      const list = await todoistApi.fetchProjects();
      setProjects(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim() || !selectedProjectId) return;
    try {
      setError(null);
      await todoistApi.createSection(newSectionName.trim(), selectedProjectId);
      setNewSectionName('');
      await loadMeta(selectedProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar seção');
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    try {
      setError(null);
      await todoistApi.createLabel(newLabelName.trim());
      setNewLabelName('');
      setLabels(await todoistApi.fetchLabels());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar etiqueta');
    }
  };

  const handleDeleteProject = async (project: TodoistProject) => {
    if (!window.confirm(`Excluir projeto "${project.name}" e todas as tarefas?`)) return;
    try {
      setError(null);
      await todoistApi.deleteProject(project.id);
      const list = await todoistApi.fetchProjects();
      setProjects(list);
      if (selectedProjectId === project.id) {
        await refresh(list[0]?.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir projeto');
    }
  };

  const handleDeleteSection = async (section: TodoistSection) => {
    if (!window.confirm(`Excluir seção "${section.name}"?`)) return;
    try {
      setError(null);
      await todoistApi.deleteSection(section.id);
      await loadMeta(selectedProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir seção');
    }
  };

  const handleDeleteLabel = async (label: TodoistLabel) => {
    if (!window.confirm(`Excluir etiqueta "${label.name}"?`)) return;
    try {
      setError(null);
      await todoistApi.deleteLabel(label.id);
      setLabels(await todoistApi.fetchLabels());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir etiqueta');
    }
  };

  const toggleCreateLabel = (name: string) => {
    setCreateForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(name)
        ? prev.labels.filter((l) => l !== name)
        : [...prev.labels, name],
    }));
  };

  const toggleEditLabel = (name: string) => {
    setEditForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(name)
        ? prev.labels.filter((l) => l !== name)
        : [...prev.labels, name],
    }));
  };

  const pending = tasks.filter((t) => !t.is_completed);
  const done = tasks.filter((t) => t.is_completed);

  return (
    <div>
      <PageHeader
        badge="Ops"
        title="Fila operacional"
        subtitle={
          projectName
            ? `Projeto: ${projectName}`
            : 'Tarefas da equipe via Todoist'
        }
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
          <div className={styles.toolbar}>
            <div className={styles.toolbarRow}>
              {projects.length > 0 && (
                <div className={styles.field}>
                  <label className="label" htmlFor="todoist-project">
                    Projeto
                  </label>
                  <select
                    id="todoist-project"
                    className={`input ${styles.inputWide}`}
                    value={selectedProjectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    disabled={loading || Boolean(appliedFilterQuery)}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className={styles.field}>
                <label className="label" htmlFor="section-filter">
                  Seção
                </label>
                <select
                  id="section-filter"
                  className={`input ${styles.inputWide}`}
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  disabled={loading || Boolean(appliedFilterQuery)}
                >
                  <option value="">Todas</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className="label" htmlFor="label-filter">
                  Etiqueta
                </label>
                <select
                  id="label-filter"
                  className={`input ${styles.inputWide}`}
                  value={labelFilter}
                  onChange={(e) => setLabelFilter(e.target.value)}
                  disabled={loading || Boolean(appliedFilterQuery)}
                >
                  <option value="">Todas</option>
                  {labels.map((l) => (
                    <option key={l.id} value={l.name}>
                      @{l.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setAppliedFilterQuery('');
                  void refresh(selectedProjectId);
                }}
                disabled={loading}
              >
                Filtrar
              </button>
            </div>

            <div className={styles.toolbarRow}>
              <div className={`${styles.field} ${styles.fieldGrow}`}>
                <label className="label" htmlFor="filter-query">
                  Filtro Todoist
                </label>
                <input
                  id="filter-query"
                  className={`input ${styles.inputWide}`}
                  placeholder="ex: today, #Projeto & p1"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyFilters();
                  }}
                />
              </div>
              <button type="button" className="btn-ghost" onClick={applyFilters} disabled={loading}>
                Aplicar filtro
              </button>
              {appliedFilterQuery && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setFilterQuery('');
                    setAppliedFilterQuery('');
                    void refresh(selectedProjectId);
                  }}
                >
                  Limpar filtro
                </button>
              )}
            </div>

            <form className={styles.toolbarRow} onSubmit={(e) => void handleQuickAdd(e)}>
              <div className={`${styles.field} ${styles.fieldGrow}`}>
                <label className="label" htmlFor="quick-add">
                  Adição rápida
                </label>
                <input
                  id="quick-add"
                  className={`input ${styles.inputWide}`}
                  placeholder="Comprar leite amanhã #Projeto @urgente p1"
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={!quickAddText.trim()}>
                Adicionar
              </button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              className={styles.accordionHeader}
              onClick={() => setShowCreateForm((v) => !v)}
            >
              <span>Nova tarefa</span>
              <span>{showCreateForm ? '−' : '+'}</span>
            </button>
            {showCreateForm && (
              <form className={styles.accordionBody} onSubmit={(e) => void handleCreateTask(e)}>
                <div className={styles.createFormGrid}>
                  <div className={styles.field}>
                    <label className="label" htmlFor="create-content">
                      Título
                    </label>
                    <input
                      id="create-content"
                      className="input"
                      required
                      value={createForm.content}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, content: e.target.value }))
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className="label" htmlFor="create-due">
                      Vencimento
                    </label>
                    <input
                      id="create-due"
                      type="date"
                      className="input"
                      value={createForm.due_date}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, due_date: e.target.value }))
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className="label" htmlFor="create-priority">
                      Prioridade
                    </label>
                    <select
                      id="create-priority"
                      className="input"
                      value={createForm.priority}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, priority: Number(e.target.value) }))
                      }
                    >
                      <option value={1}>P1 — Urgente</option>
                      <option value={2}>P2 — Alta</option>
                      <option value={3}>P3 — Média</option>
                      <option value={4}>P4 — Normal</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className="label" htmlFor="create-section">
                      Seção
                    </label>
                    <select
                      id="create-section"
                      className="input"
                      value={createForm.section_id}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, section_id: e.target.value }))
                      }
                    >
                      <option value="">Nenhuma</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className="label" htmlFor="create-desc">
                    Descrição
                  </label>
                  <textarea
                    id="create-desc"
                    className="input"
                    rows={2}
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>
                {labels.length > 0 && (
                  <div className={styles.field}>
                    <span className="label">Etiquetas</span>
                    <div className={styles.checkboxRow}>
                      {labels.map((l) => (
                        <label key={l.id} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={createForm.labels.includes(l.name)}
                            onChange={() => toggleCreateLabel(l.name)}
                          />
                          @{l.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <button type="submit" className="btn-primary">
                  Criar tarefa
                </button>
              </form>
            )}
          </div>

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
                <h2 className={styles.detailTitle}>Detalhe da tarefa</h2>
                <div className={styles.detailForm}>
                  <div className={styles.field}>
                    <label className="label" htmlFor="edit-content">
                      Título
                    </label>
                    <input
                      id="edit-content"
                      className="input"
                      value={editForm.content}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, content: e.target.value }))
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className="label" htmlFor="edit-desc">
                      Descrição
                    </label>
                    <textarea
                      id="edit-desc"
                      className="input"
                      rows={3}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, description: e.target.value }))
                      }
                    />
                  </div>
                  <div className={styles.createFormGrid}>
                    <div className={styles.field}>
                      <label className="label" htmlFor="edit-due">
                        Vencimento
                      </label>
                      <input
                        id="edit-due"
                        type="date"
                        className="input"
                        value={editForm.due_date}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, due_date: e.target.value }))
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className="label" htmlFor="edit-priority">
                        Prioridade
                      </label>
                      <select
                        id="edit-priority"
                        className="input"
                        value={editForm.priority}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, priority: Number(e.target.value) }))
                        }
                      >
                        <option value={1}>P1</option>
                        <option value={2}>P2</option>
                        <option value={3}>P3</option>
                        <option value={4}>P4</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className="label" htmlFor="edit-section">
                        Seção
                      </label>
                      <select
                        id="edit-section"
                        className="input"
                        value={editForm.section_id}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, section_id: e.target.value }))
                        }
                      >
                        <option value="">Nenhuma</option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {labels.length > 0 && (
                    <div className={styles.field}>
                      <span className="label">Etiquetas</span>
                      <div className={styles.checkboxRow}>
                        {labels.map((l) => (
                          <label key={l.id} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={editForm.labels.includes(l.name)}
                              onChange={() => toggleEditLabel(l.name)}
                            />
                            @{l.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={styles.detailActions}>
                    <button type="button" className="btn-primary" onClick={() => void saveTaskEdit()}>
                      Salvar
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setSelectedTask(null)}>
                      Fechar
                    </button>
                    <a
                      href={selectedTask.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                    >
                      Abrir no Todoist
                    </a>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => void deleteSelectedTask()}
                    >
                      Excluir
                    </button>
                  </div>
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
                  <div className={styles.field}>
                    <label className="label" htmlFor="new-comment">
                      Novo comentário
                    </label>
                    <textarea
                      id="new-comment"
                      className="input"
                      rows={2}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => void addComment()}
                    disabled={!newComment.trim()}
                  >
                    Adicionar comentário
                  </button>
                </div>
              </aside>
            )}
          </div>
        </>
      )}

      {viewTab === 'manage' && (
        <div className="card">
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setManageOpen((v) => !v)}
          >
            <span>Projetos, seções e etiquetas</span>
            <span>{manageOpen ? '−' : '+'}</span>
          </button>
          {manageOpen && (
            <div className={styles.accordionBody}>
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
                        onClick={() => void handleDeleteProject(p)}
                      >
                        Excluir
                      </button>
                    </li>
                  ))}
                </ul>
                <form className={styles.manageForm} onSubmit={(e) => void handleCreateProject(e)}>
                  <input
                    className="input"
                    placeholder="Nome do projeto"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" disabled={!newProjectName.trim()}>
                    Criar projeto
                  </button>
                </form>
              </div>

              <div className={styles.manageSection}>
                <h3>Seções ({projectName ?? 'projeto selecionado'})</h3>
                <ul className={styles.manageList}>
                  {sections.map((s) => (
                    <li key={s.id} className={styles.manageItem}>
                      <span>{s.name}</span>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => void handleDeleteSection(s)}
                      >
                        Excluir
                      </button>
                    </li>
                  ))}
                </ul>
                <form className={styles.manageForm} onSubmit={(e) => void handleCreateSection(e)}>
                  <input
                    className="input"
                    placeholder="Nome da seção"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!newSectionName.trim() || !selectedProjectId}
                  >
                    Criar seção
                  </button>
                </form>
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
                        onClick={() => void handleDeleteLabel(l)}
                      >
                        Excluir
                      </button>
                    </li>
                  ))}
                </ul>
                <form className={styles.manageForm} onSubmit={(e) => void handleCreateLabel(e)}>
                  <input
                    className="input"
                    placeholder="Nome da etiqueta"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" disabled={!newLabelName.trim()}>
                    Criar etiqueta
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
