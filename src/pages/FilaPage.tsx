import { useCallback, useEffect, useState } from 'react';
import type { TodoistTask } from '../types/database';

export function FilaPage() {
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/todoist/tasks');
      const body = (await res.json()) as {
        tasks?: TodoistTask[];
        projectName?: string;
        error?: string;
        configured?: boolean;
      };
      if (!res.ok) {
        throw new Error(body.error ?? 'Falha ao carregar tarefas');
      }
      if (body.configured === false) {
        setError(
          'Todoist não configurado no servidor. Defina TODOIST_API_TOKEN na Vercel ou .env local.',
        );
        setTasks([]);
        return;
      }
      setTasks(body.tasks ?? []);
      setProjectName(body.projectName ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar fila');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleTask = async (task: TodoistTask) => {
    try {
      const res = await fetch(`/api/todoist/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Falha ao atualizar tarefa');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar');
    }
  };

  const pending = tasks.filter((t) => !t.is_completed);
  const done = tasks.filter((t) => t.is_completed);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0, flex: 1 }}>
          Fila operacional
        </h1>
        <button type="button" className="btn-ghost" onClick={() => void load()}>
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
      </div>
      <p className="page-subtitle">
        {projectName ? `Projeto: ${projectName}` : 'Tarefas da equipe via Todoist'}
      </p>

      {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}
      {loading && <p style={{ color: 'var(--muted)' }}>Carregando tarefas…</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <section className="card">
          <h2 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Pendentes ({pending.length})</h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pending.map((t) => (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => void toggleTask(t)}
                  aria-label={`Concluir ${t.content}`}
                />
                <div>
                  <div>{t.content}</div>
                  {t.due?.date && (
                    <small style={{ color: 'var(--muted)' }}>Vence: {t.due.date}</small>
                  )}
                </div>
              </li>
            ))}
            {!loading && pending.length === 0 && (
              <li style={{ color: 'var(--muted)' }}>Nenhuma tarefa pendente.</li>
            )}
          </ul>
        </section>
        <section className="card">
          <h2 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Concluídas ({done.length})</h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {done.map((t) => (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                  opacity: 0.75,
                }}
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() => void toggleTask(t)}
                  aria-label={`Reabrir ${t.content}`}
                />
                <div style={{ textDecoration: 'line-through' }}>{t.content}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
