import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import type { TodoistTask } from '../types/database';
import styles from './FilaPage.module.css';

interface TodoistProject {
  id: string;
  name: string;
}

const PROJECT_STORAGE_KEY = 'nexushub-todoist-project';

function pickProjectId(list: TodoistProject[], preferred?: string): string {
  if (preferred && list.some((p) => p.id === preferred)) return preferred;
  const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
  if (stored && list.some((p) => p.id === stored)) return stored;
  return list[0]?.id ?? '';
}

export function FilaPage() {
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [projects, setProjects] = useState<TodoistProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectName, setProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async (projectId: string) => {
    const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const res = await fetch(`/api/todoist/tasks${qs}`);
    const body = (await res.json()) as {
      tasks?: TodoistTask[];
      projectName?: string;
      projectId?: string | null;
      error?: string;
      configured?: boolean;
    };
    if (!res.ok) throw new Error(body.error ?? 'Falha ao carregar tarefas');
    if (body.configured === false) {
      throw new Error(
        'Todoist não configurado no servidor. Defina TODOIST_API_TOKEN na Vercel ou .env local.',
      );
    }
    setTasks(body.tasks ?? []);
    setProjectName(body.projectName ?? null);
    const resolvedId = body.projectId ?? projectId;
    if (resolvedId) {
      setSelectedProjectId(resolvedId);
      localStorage.setItem(PROJECT_STORAGE_KEY, resolvedId);
    }
  }, []);

  const refresh = useCallback(
    async (projectId?: string) => {
      setLoading(true);
      setError(null);
      try {
        let list = projects;
        if (list.length === 0) {
          const res = await fetch('/api/todoist/projects');
          const body = (await res.json()) as {
            projects?: TodoistProject[];
            configured?: boolean;
            error?: string;
          };
          if (!res.ok) throw new Error(body.error ?? 'Falha ao carregar projetos');
          if (body.configured === false) {
            throw new Error(
              'Todoist não configurado no servidor. Defina TODOIST_API_TOKEN na Vercel ou .env local.',
            );
          }
          list = body.projects ?? [];
          setProjects(list);
        }

        const id = pickProjectId(list, projectId ?? selectedProjectId);
        if (!id) {
          setTasks([]);
          return;
        }
        await loadTasks(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar fila');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    },
    [loadTasks, projects, selectedProjectId],
  );

  useEffect(() => {
    void refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProjectChange = (projectId: string) => {
    void refresh(projectId);
  };

  const toggleTask = async (task: TodoistTask) => {
    try {
      const res = await fetch(`/api/todoist/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Falha ao atualizar tarefa');
      await loadTasks(selectedProjectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar');
    }
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

      {projects.length > 0 && (
        <div className={styles.projectBar}>
          <label className="label" htmlFor="todoist-project">
            Projeto Todoist
          </label>
          <select
            id="todoist-project"
            className={`input ${styles.projectSelect}`}
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            disabled={loading}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}
      {loading && <p style={{ color: 'var(--muted)' }}>Carregando tarefas…</p>}

      <div className={styles.grid}>
        <section className="card">
          <h2 className={styles.sectionTitle}>Pendentes ({pending.length})</h2>
          <ul className={styles.taskList}>
            {pending.map((t) => (
              <li key={t.id} className={styles.taskItem}>
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => void toggleTask(t)}
                  aria-label={`Concluir ${t.content}`}
                />
                <div>
                  <div>{t.content}</div>
                  {t.due?.date && (
                    <small className={styles.taskDue}>Vence: {t.due.date}</small>
                  )}
                </div>
              </li>
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
              <li key={t.id} className={`${styles.taskItem} ${styles.taskDone}`}>
                <input
                  type="checkbox"
                  checked
                  onChange={() => void toggleTask(t)}
                  aria-label={`Reabrir ${t.content}`}
                />
                <div className={styles.taskDoneText}>{t.content}</div>
              </li>
            ))}
            {!loading && done.length === 0 && (
              <li className={styles.empty}>Nenhuma tarefa concluída recente.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
