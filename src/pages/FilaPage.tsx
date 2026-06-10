import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { CreateTaskModal } from '../components/CreateTaskModal';
import composerStyles from '../components/CreateTaskModal.module.css';
import { PromptNameModal } from '../components/PromptNameModal';
import { NavIcon } from '../components/NavIcon';
import { UserAvatar } from '../components/UserAvatar';
import { PageHeader } from '../components/PageHeader';
import { ProjectSelector } from '../components/ProjectSelector';
import { TodoistIcon } from '../components/TodoistIcon';
import * as todoistApi from '../lib/todoistApi';
import { useAuth } from '../contexts/AuthContext';
import { useTeamAvatarMap, type TeamAvatarMap } from '../hooks/useTeamAvatarMap';
import type { AssigneeHub, AssigneeOption } from '../lib/todoistAssignees';
import { hubFromUsuario, taskIsAssignedToHub, TEAM_ASSIGNEES } from '../lib/todoistAssignees';
import {
  filaOperacionalProjects,
  matchProjectToSystem,
  sortProjectsByClient,
} from '../lib/systemLogos';
import {
  buildTodoistTaskDisplayList,
  countDescendants,
  filterCollapsedTasks,
  getParentIdsWithChildren,
  isTodoistHeadingContent,
  TodoistTaskContent,
  todoistPlainText,
} from '../lib/todoistContent';
import {
  FILA_TASK_SORT_OPTIONS,
  FILA_TASK_SORT_STORAGE_KEY,
  getFilaTaskCompare,
  isFilaTaskSortMode,
  type FilaTaskSortMode,
} from '../lib/filaTaskSort';
import {
  formatTodoistDueDisplay,
  taskMatchesDuePreset,
  taskMatchesFilaQuickFilter,
  todoistDuePresetToApi,
  type TodoistDuePreset,
} from '../lib/todoistDuePt';
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
type DuePreset = TodoistDuePreset;

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
  { value: 1, label: 'P1', title: 'Urgente (vermelho)' },
  { value: 2, label: 'P2', title: 'Alta (amarelo)' },
  { value: 3, label: 'P3', title: 'Média (verde)' },
  { value: 4, label: 'P4', title: 'Baixa (cinza)' },
] as const;

const COMMENT_PRESETS = ['Ok', 'Em andamento', 'Bloqueado', 'Precisa revisão'];

type CreatePromptKind = 'project' | 'section' | 'label';

const CREATE_PROMPT: Record<
  CreatePromptKind,
  { title: string; fieldLabel: string; placeholder: string }
> = {
  project: {
    title: 'Novo projeto',
    fieldLabel: 'Nome do projeto',
    placeholder: 'Ex.: Cliente — Sistema',
  },
  section: {
    title: 'Nova seção',
    fieldLabel: 'Nome da seção',
    placeholder: 'Ex.: Backlog',
  },
  label: {
    title: 'Nova etiqueta',
    fieldLabel: 'Nome da etiqueta',
    placeholder: 'Ex.: urgente',
  },
};

function pickProjectId(list: TodoistProject[], preferred?: string): string {
  const visible = filaOperacionalProjects(list);
  if (preferred && visible.some((p) => p.id === preferred)) return preferred;
  const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
  if (stored && visible.some((p) => p.id === stored)) return stored;
  const sorted = sortProjectsByClient(visible);
  const firstClient = sorted.find((p) => matchProjectToSystem(p.name));
  return firstClient?.id ?? sorted[0]?.id ?? '';
}

function getPriorityInfo(priority: number) {
  return PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[3];
}

function priorityClass(priority: number): string {
  if (priority === 1) return styles.p1;
  if (priority === 2) return styles.p2;
  if (priority === 3) return styles.p3;
  return styles.p4;
}

const FILTER_QUERY_PT: Record<Exclude<QuickFilter, ''>, string> = {
  today: 'hoje',
  tomorrow: 'amanhã',
  overdue: 'atrasado',
  p1: 'p1',
};

function filterQueryFor(id: QuickFilter): string | undefined {
  if (!id) return undefined;
  return FILTER_QUERY_PT[id];
}

interface ChipProps {
  active?: boolean;
  disabled?: boolean;
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

function Chip({ active, disabled, onClick, children, title, priorityTone }: ChipProps) {
  const priority =
    priorityTone !== undefined ? PRIORITY_CHIP_CLASS[priorityTone] : null;
  return (
    <button
      type="button"
      className={[
        styles.chip,
        priority?.base,
        active && (priority ? priority.active : styles.chipActive),
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function resolveTaskAssignee(
  task: TodoistTask,
  teamAvatars: TeamAvatarMap,
): { name: string; email?: string; avatarUrl?: string | null } | null {
  if (!task.assignee_name && !task.assignee_hub) return null;
  const hub = task.assignee_hub as AssigneeHub | undefined;
  const profile = hub ? teamAvatars[hub] : undefined;
  const name = task.assignee_name ?? profile?.name;
  if (!name) return null;
  return {
    name,
    email: profile?.email,
    avatarUrl: profile?.avatarUrl ?? null,
  };
}

interface TaskRowProps {
  task: TodoistTask;
  teamAvatars: TeamAvatarMap;
  depth?: number;
  sectionName?: string;
  selected: boolean;
  hasChildren?: boolean;
  collapsed?: boolean;
  childCount?: number;
  onToggleCollapse?: (taskId: string) => void;
  onSelect: (task: TodoistTask) => void;
}

const TaskRow = memo(function TaskRow({
  task,
  teamAvatars,
  depth = 0,
  sectionName,
  selected,
  hasChildren = false,
  collapsed = false,
  childCount = 0,
  onToggleCollapse,
  onSelect,
}: TaskRowProps) {
  const due = formatTodoistDueDisplay(task.due);
  const assignee = resolveTaskAssignee(task, teamAvatars);
  const heading = isTodoistHeadingContent(task.content);
  const plainTitle = todoistPlainText(task.content);
  const priority = getPriorityInfo(task.priority);
  return (
    <li
      className={`${styles.taskItem} ${task.is_completed ? styles.taskDone : ''} ${selected ? styles.taskItemSelected : ''} ${depth > 0 ? styles.taskSubtask : ''} ${heading ? styles.taskHeading : ''}`}
      style={{ '--depth': depth } as CSSProperties}
    >
      {hasChildren ? (
        <button
          type="button"
          className={styles.expandBtn}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.(task.id);
          }}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expandir ${plainTitle}` : `Recolher ${plainTitle}`}
          title={collapsed ? `Expandir (${childCount} subtarefas)` : 'Recolher'}
        >
          <NavIcon
            name="chevronDown"
            className={`${styles.expandIcon} ${!collapsed ? styles.expandIconOpen : ''}`}
          />
        </button>
      ) : (
        <span className={styles.expandSpacer} aria-hidden />
      )}
      {!heading && (
        <span
          className={`${styles.priorityTag} ${priorityClass(task.priority)}`}
          title={`Prioridade ${priority.title}`}
        >
          {priority.label}
        </span>
      )}
      {heading && <span className={styles.headingMarker} aria-hidden />}
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
        <div
          className={`${styles.taskTitle} ${task.is_completed ? styles.taskDoneText : ''} ${heading ? styles.taskTitleHeading : ''}`}
        >
          <TodoistTaskContent content={task.content} />
          {hasChildren && collapsed && childCount > 0 && (
            <span className={styles.childCountBadge}>{childCount}</span>
          )}
          {(task.note_count ?? 0) > 0 && (
            <span className={styles.noteCount}>{task.note_count} coment.</span>
          )}
        </div>
        <div className={styles.taskMeta}>
          {assignee && (
            <span className={styles.assigneeChip} title={assignee.name}>
              <UserAvatar
                size="xs"
                name={assignee.name}
                email={assignee.email}
                avatarUrl={assignee.avatarUrl}
                className={styles.assigneeAvatar}
              />
              <span className={styles.assigneeName}>{assignee.name}</span>
            </span>
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
});

export function FilaPage() {
  const { profile } = useAuth();
  const teamAvatars = useTeamAvatarMap();
  const myHub = hubFromUsuario(profile?.usuario);
  const [viewTab, setViewTab] = useState<ViewTab>('tasks');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [taskSort, setTaskSort] = useState<FilaTaskSortMode>(() => {
    try {
      const stored = localStorage.getItem(FILA_TASK_SORT_STORAGE_KEY);
      if (isFilaTaskSortMode(stored)) return stored;
    } catch {
      /* ignore */
    }
    return 'default';
  });
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
  const [descriptionDraft, setDescriptionDraft] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>(
    TEAM_ASSIGNEES.map((t) => ({ ...t, assignee_id: null, uid: null })),
  );
  const [completedOpen, setCompletedOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(() => new Set());
  const [createPromptKind, setCreatePromptKind] = useState<CreatePromptKind | null>(null);
  const [completedLoaded, setCompletedLoaded] = useState(false);
  const [loadingCompleted, setLoadingCompleted] = useState(false);

  const projectsRef = useRef<TodoistProject[]>([]);
  projectsRef.current = projects;

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

  const mergeTaskInList = useCallback((updated: TodoistTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const applyTasksResponse = useCallback(
    (data: Awaited<ReturnType<typeof todoistApi.fetchTasks>>, projectId: string) => {
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

  const fetchActiveTasks = useCallback(
    async (
      projectId: string,
      opts?: { sectionId?: string; label?: string; filterQuery?: string; clientQuickFilter?: boolean },
    ) => {
      const useApiQuickFilter = Boolean(opts?.filterQuery) && !opts?.clientQuickFilter;
      const data = await todoistApi.fetchTasks({
        projectId: useApiQuickFilter ? undefined : projectId,
        sectionId: opts?.sectionId,
        label: opts?.label,
        filterQuery: useApiQuickFilter ? opts?.filterQuery : undefined,
        skipProjects: true,
        includeCompleted: false,
      });
      applyTasksResponse(data, projectId);
      setTasks((prev) => {
        const done = prev.filter((t) => t.is_completed);
        return [...data.tasks, ...done];
      });
      return data;
    },
    [applyTasksResponse],
  );

  const loadCompletedTasks = useCallback(
    async (projectId: string) => {
      if (!projectId) return;
      setLoadingCompleted(true);
      try {
        const data = await todoistApi.fetchTasks({
          projectId,
          sectionId: sectionFilter || undefined,
          label: labelFilter || undefined,
          completedOnly: true,
          skipProjects: true,
        });
        setTasks((prev) => {
          const active = prev.filter((t) => !t.is_completed);
          return [...active, ...data.tasks];
        });
        setCompletedLoaded(true);
      } catch {
        /* mantém lista atual */
      } finally {
        setLoadingCompleted(false);
      }
    },
    [labelFilter, sectionFilter],
  );

  const refreshTasksOnly = useCallback(
    async (opts?: { silent?: boolean }) => {
      const id = selectedProjectId;
      const filterQ = filterQueryFor(quickFilter);
      const clientQuickFilter = Boolean(onlyMyTasks && filterQ);
      if (!id && !filterQ) return;
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        await fetchActiveTasks(id, {
          sectionId: sectionFilter || undefined,
          label: labelFilter || undefined,
          filterQuery: filterQ,
          clientQuickFilter,
        });
        if (completedLoaded && id && (!filterQ || clientQuickFilter)) {
          await loadCompletedTasks(id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar tarefas');
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [
      completedLoaded,
      fetchActiveTasks,
      loadCompletedTasks,
      onlyMyTasks,
      quickFilter,
      sectionFilter,
      labelFilter,
      selectedProjectId,
    ],
  );

  const refresh = useCallback(
    async (projectId?: string) => {
      setLoading(true);
      setError(null);
      setCompletedLoaded(false);
      try {
        let list = projectsRef.current;
        if (list.length === 0) {
          list = await todoistApi.fetchProjects();
          setProjects(list);
        }

        const id = pickProjectId(list, projectId ?? selectedProjectId);
        const filterQ = filterQueryFor(quickFilter);
        const clientQuickFilter = Boolean(onlyMyTasks && filterQ);

        if (!id && !filterQ) {
          setTasks([]);
          return;
        }

        if (id) await loadMeta(id);
        await fetchActiveTasks(id, {
          sectionId: sectionFilter || undefined,
          label: labelFilter || undefined,
          filterQuery: filterQ,
          clientQuickFilter,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar fila');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchActiveTasks, loadMeta, onlyMyTasks, quickFilter, sectionFilter, labelFilter, selectedProjectId],
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
    const timer = window.setTimeout(() => {
      setCompletedLoaded(false);
      void refreshTasksOnly();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [sectionFilter, labelFilter, quickFilter, onlyMyTasks, projects.length, refreshTasksOnly]);

  useEffect(() => {
    if (!completedOpen || !selectedProjectId || completedLoaded) return;
    void loadCompletedTasks(selectedProjectId);
  }, [completedOpen, completedLoaded, loadCompletedTasks, selectedProjectId]);

  const loadComments = useCallback(async (taskId: string) => {
    try {
      setComments(await todoistApi.fetchComments(taskId));
    } catch {
      setComments([]);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedTask(null);
    setRenamingTitle(false);
    setDescriptionDraft('');
    setComments([]);
  }, []);

  const selectTask = useCallback(
    async (task: TodoistTask) => {
      setSelectedTask(task);
      setTitleDraft(task.content);
      setDescriptionDraft(task.description ?? '');
      setRenamingTitle(false);
      await loadComments(task.id);
    },
    [loadComments],
  );

  useEffect(() => {
    if (!selectedTask) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !renamingTitle) closeDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedTask, renamingTitle, closeDetail]);

  const handleProjectChange = (projectId: string) => {
    setSectionFilter('');
    setQuickFilter('');
    setCollapsedTasks(new Set());
    setCompletedLoaded(false);
    setCompletedOpen(false);
    void refresh(projectId);
  };

  const handleTaskCreated = (projectId: string) => {
    if (projectId !== selectedProjectId) {
      void refresh(projectId);
    } else {
      void refreshTasksOnly();
    }
  };

  const toggleTask = async (task: TodoistTask) => {
    try {
      setError(null);
      const updated = await todoistApi.updateTask(task.id, { is_completed: !task.is_completed });
      mergeTaskInList(updated);
      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }
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
      mergeTaskInList(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const saveTitle = async () => {
    if (!selectedTask || !titleDraft.trim()) return;
    await patchSelected({ content: titleDraft.trim() });
    setRenamingTitle(false);
  };

  const saveDescription = async () => {
    if (!selectedTask) return;
    const next = descriptionDraft.trim();
    const current = (selectedTask.description ?? '').trim();
    if (next === current) return;
    await patchSelected({ description: next });
  };

  const deleteSelectedTask = async () => {
    if (!selectedTask) return;
    if (!window.confirm(`Excluir tarefa "${selectedTask.content}"?`)) return;
    try {
      setError(null);
      await todoistApi.deleteTask(selectedTask.id);
      setSelectedTask(null);
      setComments([]);
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
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

  const handleCreateConfirm = async (name: string) => {
    if (!createPromptKind) return;
    setError(null);
    if (createPromptKind === 'project') {
      await todoistApi.createProject(name);
      setProjects(await todoistApi.fetchProjects());
    } else if (createPromptKind === 'section') {
      if (!selectedProjectId) {
        throw new Error('Selecione um projeto na aba Tarefas antes de criar uma seção.');
      }
      await todoistApi.createSection(name, selectedProjectId);
      await loadMeta(selectedProjectId);
    } else {
      await todoistApi.createLabel(name);
      setLabels(await todoistApi.fetchLabels());
    }
  };

  const toggleSelectedLabel = async (name: string) => {
    if (!selectedTask) return;
    const current = selectedTask.labels ?? [];
    const next = current.includes(name)
      ? current.filter((l) => l !== name)
      : [...current, name];
    await patchSelected({ labels: next });
  };

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const filterByAssignee = useCallback(
    (list: TodoistTask[]) => {
      if (!onlyMyTasks || !myHub) return list;
      return list.filter((t) => taskIsAssignedToHub(t, myHub, assigneeOptions));
    },
    [onlyMyTasks, myHub, assigneeOptions],
  );

  const filterByQuick = useCallback(
    (list: TodoistTask[]) => {
      if (!quickFilter || !onlyMyTasks) return list;
      return list.filter((t) => taskMatchesFilaQuickFilter(t, quickFilter));
    },
    [quickFilter, onlyMyTasks],
  );

  const pending = useMemo(
    () => filterByQuick(filterByAssignee(tasks.filter((t) => !t.is_completed))),
    [tasks, filterByAssignee, filterByQuick],
  );
  const done = useMemo(
    () => filterByQuick(filterByAssignee(tasks.filter((t) => t.is_completed))),
    [tasks, filterByAssignee, filterByQuick],
  );

  useEffect(() => {
    if (!onlyMyTasks || !myHub || !selectedTask) return;
    if (!taskIsAssignedToHub(selectedTask, myHub, assigneeOptions)) {
      closeDetail();
    }
  }, [onlyMyTasks, myHub, selectedTask, assigneeOptions, closeDetail]);
  const pendingParents = useMemo(() => getParentIdsWithChildren(pending), [pending]);
  const doneParents = useMemo(() => getParentIdsWithChildren(done), [done]);
  const sortCompare = useMemo(
    () => getFilaTaskCompare(taskSort, sectionMap),
    [taskSort, sectionMap],
  );
  const pendingDisplay = useMemo(
    () =>
      filterCollapsedTasks(buildTodoistTaskDisplayList(pending, sortCompare), pending, collapsedTasks),
    [pending, collapsedTasks, sortCompare],
  );
  const doneDisplay = useMemo(
    () =>
      filterCollapsedTasks(buildTodoistTaskDisplayList(done, sortCompare), done, collapsedTasks),
    [done, collapsedTasks, sortCompare],
  );

  const handleTaskSortChange = (mode: FilaTaskSortMode) => {
    setTaskSort(mode);
    try {
      localStorage.setItem(FILA_TASK_SORT_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={styles.filaPage}>
      <PageHeader
        badge="Ops"
        title="Fila operacional"
        subtitle={projectName ? `Projeto: ${projectName}` : 'Tarefas da equipe via Todoist'}
        actions={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`btn-ghost ${styles.iconBtnRound}`}
              onClick={() => void refresh()}
              aria-label="Atualizar"
              title="Atualizar"
            >
              <NavIcon
                name="refresh"
                className={`${styles.refreshIcon} ${loading ? styles.spin : ''}`}
              />
            </button>
            <a
              href="https://todoist.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-ghost ${styles.iconBtn}`}
              aria-label="Abrir Todoist"
              title="Abrir Todoist"
            >
              <TodoistIcon className={styles.todoistIcon} />
              <NavIcon name="external" className={styles.headerIconSm} />
            </a>
          </div>
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
          <div className={styles.tasksToolbar}>
            {projects.length > 0 && (
              <ProjectSelector
                projects={filaOperacionalProjects(projects)}
                value={selectedProjectId}
                onChange={handleProjectChange}
                disabled={loading || Boolean(quickFilter)}
              />
            )}
            <button
              type="button"
              className={`btn-primary ${styles.createBtn}`}
              onClick={() => setCreateOpen(true)}
              disabled={loading || projects.length === 0}
            >
              + Criar tarefa
            </button>
          </div>

          <CreateTaskModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            projects={projects}
            labels={labels}
            defaultProjectId={selectedProjectId}
            onCreated={handleTaskCreated}
          />

          <div className={styles.filterBar}>
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
              <Chip
                active={onlyMyTasks}
                disabled={!myHub}
                onClick={() => setOnlyMyTasks((v) => !v)}
                title={
                  myHub
                    ? `Mostrar só tarefas de ${profile?.nome ?? myHub}`
                    : 'Perfil sem vínculo com a equipe Todoist'
                }
              >
                Minhas tarefas
              </Chip>
            </div>
            {(sections.length > 0 || labels.length > 0) && !quickFilter && (
              <button
                type="button"
                className={`btn-ghost ${styles.filterToggle}`}
                onClick={() => setAdvancedFiltersOpen((o) => !o)}
              >
                {advancedFiltersOpen ? 'Menos filtros' : 'Mais filtros'}
              </button>
            )}
          </div>

          {advancedFiltersOpen && !quickFilter && sections.length > 0 && (
            <div className={styles.chipRow} style={{ marginBottom: '0.65rem' }}>
              <span className={styles.chipGroupLabel}>Seção</span>
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

          {advancedFiltersOpen && !quickFilter && labels.length > 0 && (
            <div className={styles.chipRow} style={{ marginBottom: '1rem' }}>
              <span className={styles.chipGroupLabel}>Etiqueta</span>
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

          <div className={styles.layout}>
            <div className={styles.listColumn}>
              <section className={`card ${styles.taskListCard}`}>
                <div className={styles.listCardHead}>
                  <h2 className={styles.sectionTitle}>
                    Pendentes
                    <span className={styles.sectionCount}>{pending.length}</span>
                  </h2>
                  <div className={styles.sortBar}>
                    <span className={styles.sortLabel}>Ordenar</span>
                    <div className={styles.sortChips}>
                      {FILA_TASK_SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`${styles.sortChip} ${taskSort === opt.id ? styles.sortChipActive : ''}`}
                          onClick={() => handleTaskSortChange(opt.id)}
                          title={opt.title}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <ul className={`${styles.taskList} ${styles.taskListScroll}`}>
                  {pendingDisplay.map(({ task, depth }) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      teamAvatars={teamAvatars}
                      depth={depth}
                      sectionName={task.section_id ? sectionMap.get(task.section_id) : undefined}
                      selected={selectedTask?.id === task.id}
                      hasChildren={pendingParents.has(task.id)}
                      collapsed={collapsedTasks.has(task.id)}
                      childCount={countDescendants(task.id, pending)}
                      onToggleCollapse={toggleTaskCollapse}
                      onSelect={(task) => void selectTask(task)}
                    />
                  ))}
                  {!loading && pendingDisplay.length === 0 && (
                    <li className={styles.empty}>
                      {onlyMyTasks
                        ? 'Nenhuma tarefa sua neste filtro.'
                        : 'Nenhuma tarefa pendente.'}
                    </li>
                  )}
                </ul>
              </section>

              {selectedProjectId && !quickFilter && (
                <div className={styles.accordionWrap}>
                  <button
                    type="button"
                    className={styles.accordionHeader}
                    onClick={() => setCompletedOpen((o) => !o)}
                    aria-expanded={completedOpen}
                  >
                    <span>
                      Concluídas
                      <span className={styles.sectionCount} style={{ marginLeft: '0.5rem' }}>
                        {loadingCompleted && !completedLoaded ? '…' : done.length}
                      </span>
                    </span>
                    <NavIcon
                      name="chevronDown"
                      className={`${styles.accordionChevron} ${completedOpen ? styles.accordionChevronOpen : ''}`}
                    />
                  </button>
                  {completedOpen && (
                    <div className={styles.accordionBody}>
                      <ul className={`${styles.taskList} ${styles.taskListScroll}`}>
                        {doneDisplay.map(({ task, depth }) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            teamAvatars={teamAvatars}
                            depth={depth}
                            sectionName={task.section_id ? sectionMap.get(task.section_id) : undefined}
                            selected={selectedTask?.id === task.id}
                            hasChildren={doneParents.has(task.id)}
                            collapsed={collapsedTasks.has(task.id)}
                            childCount={countDescendants(task.id, done)}
                            onToggleCollapse={toggleTaskCollapse}
                            onSelect={(task) => void selectTask(task)}
                          />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedTask && (
            <div
              className={styles.taskModalBackdrop}
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeDetail();
              }}
            >
              <div
                className={styles.taskModalDialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-detail-title"
              >
                <div className={styles.detailHeader}>
                  <div className={styles.detailHeaderMain}>
                    <div className={composerStyles.taskComposer}>
                      {renamingTitle ? (
                        <div className={styles.renameRow}>
                          <input
                            className={composerStyles.composerTitle}
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
                        <h2
                          id="task-detail-title"
                          className={`${composerStyles.composerTitle} ${styles.detailTitleHeading}`}
                        >
                          <TodoistTaskContent content={selectedTask.content} />
                        </h2>
                      )}
                      <textarea
                        className={composerStyles.composerDescription}
                        placeholder="Descrição"
                        value={descriptionDraft}
                        rows={3}
                        aria-label="Descrição da tarefa"
                        onChange={(e) => setDescriptionDraft(e.target.value)}
                        onBlur={() => void saveDescription()}
                      />
                    </div>
                  </div>
                  <div className={styles.detailHeaderActions}>
                    {!renamingTitle && (
                      <button
                        type="button"
                        className={styles.detailHeaderBtn}
                        onClick={() => setRenamingTitle(true)}
                        aria-label="Renomear tarefa"
                        title="Renomear"
                      >
                        <NavIcon name="pencil" className={styles.detailHeaderIcon} />
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.detailHeaderBtn}
                      onClick={closeDetail}
                      aria-label="Fechar detalhes"
                      title="Fechar"
                    >
                      <NavIcon name="close" className={styles.detailHeaderIcon} />
                    </button>
                  </div>
                </div>

                <div className={styles.detailFields}>
                  <div className={styles.actionGroup}>
                    <span className={styles.fieldLabel}>Prioridade</span>
                    <div className={styles.chipRow}>
                      {PRIORITIES.map((p) => (
                        <Chip
                          key={p.value}
                          priorityTone={p.value}
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
                    <span className={styles.fieldLabel}>Prazo</span>
                    <div className={styles.chipRow}>
                      {DUE_PRESETS.map((d) => (
                        <Chip
                          key={d.id || 'none'}
                          active={taskMatchesDuePreset(selectedTask, d.id)}
                          onClick={() => void patchSelected(todoistDuePresetToApi(d.id))}
                        >
                          {d.label}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className={styles.actionGroup}>
                    <span className={styles.fieldLabel}>Responsável</span>
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
                          onClick={() =>
                            void patchSelected({ assignee_id: o.uid ?? o.assignee_id })
                          }
                          title={
                            o.uid || o.assignee_id != null
                              ? `Todoist: ${o.todoistName}`
                              : `${o.label} — não encontrado neste projeto`
                          }
                        >
                          {o.label}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {sections.length > 0 && (
                    <div className={styles.actionGroup}>
                      <span className={styles.fieldLabel}>Seção</span>
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
                      <span className={styles.fieldLabel}>Etiquetas</span>
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
                </div>

                <div className={styles.detailActions}>
                  <button
                    type="button"
                    className={`${styles.detailActionBtn} ${styles.detailActionComplete}`}
                    onClick={() => void toggleTask(selectedTask)}
                  >
                    {selectedTask.is_completed ? 'Reabrir' : 'Concluir'}
                  </button>
                  <button
                    type="button"
                    className={`${styles.detailActionBtn} ${styles.detailActionDanger}`}
                    onClick={() => void deleteSelectedTask()}
                  >
                    Excluir
                  </button>
                </div>

                <div className={styles.comments}>
                  <h3 className={styles.commentsTitle}>Comentários</h3>
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
              </div>
            </div>
          )}
        </>
      )}

      {viewTab === 'manage' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className={styles.manageActions}>
            <button type="button" className="btn-primary" onClick={() => setCreatePromptKind('project')}>
              + Novo projeto
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!selectedProjectId}
              onClick={() => setCreatePromptKind('section')}
            >
              + Nova seção
            </button>
            <button type="button" className="btn-primary" onClick={() => setCreatePromptKind('label')}>
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

      {createPromptKind && (
        <PromptNameModal
          open
          title={CREATE_PROMPT[createPromptKind].title}
          fieldLabel={CREATE_PROMPT[createPromptKind].fieldLabel}
          placeholder={CREATE_PROMPT[createPromptKind].placeholder}
          onClose={() => setCreatePromptKind(null)}
          onConfirm={handleCreateConfirm}
        />
      )}
    </div>
  );
}
