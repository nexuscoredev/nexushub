import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  archiveJarvisThread,
  createJarvisThread,
  listClienteRepos,
  listClientes,
  listJarvisMessages,
  listJarvisThreads,
} from '../lib/jarvisChats';
import type { HubCliente } from '../types/clientePortal';
import type {
  HubClienteRepo,
  HubJarvisMessage,
  HubJarvisThread,
} from '../types/jarvisChat';
import styles from './JarvisChatsPage.module.css';

interface NewConvoState {
  clienteId: string;
  repoId: string;
  repoUrlManual: string;
  repoRefManual: string;
}

const EMPTY_NEW_CONVO: NewConvoState = {
  clienteId: '',
  repoId: '',
  repoUrlManual: '',
  repoRefManual: 'main',
};

export function JarvisChatsPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<HubJarvisThread[]>([]);
  const [clientes, setClientes] = useState<HubCliente[]>([]);
  const [repos, setRepos] = useState<HubClienteRepo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HubJarvisMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newConvo, setNewConvo] = useState<NewConvoState>(EMPTY_NEW_CONVO);
  const listRef = useRef<HTMLDivElement>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const [t, c] = await Promise.all([listJarvisThreads(), listClientes()]);
      setThreads(t);
      setClientes(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar conversas');
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setMessages(await listJarvisMessages(threadId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens');
    }
  }, []);

  useEffect(() => {
    if (activeId) void loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  const openNew = () => {
    setNewConvo(EMPTY_NEW_CONVO);
    setRepos([]);
    setNewOpen(true);
  };

  const onSelectCliente = async (clienteId: string) => {
    setNewConvo((prev) => ({ ...prev, clienteId, repoId: '' }));
    try {
      setRepos(await listClienteRepos(clienteId || null));
    } catch {
      setRepos([]);
    }
  };

  const createConvo = async () => {
    if (!user?.id) return;
    const selectedRepo = repos.find((r) => r.id === newConvo.repoId);
    const repoUrl = selectedRepo?.repo_url || newConvo.repoUrlManual.trim() || null;
    const repoRef = selectedRepo?.repo_ref || newConvo.repoRefManual.trim() || 'main';
    try {
      const thread = await createJarvisThread({
        userId: user.id,
        clienteId: newConvo.clienteId || null,
        repoUrl,
        repoRef,
      });
      setThreads((prev) => [thread, ...prev]);
      setActiveId(thread.id);
      setNewOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar conversa');
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setDraft('');
    setSending(true);
    setError(null);

    const optimistic: HubJarvisMessage = {
      id: `tmp-${Date.now()}`,
      thread_id: activeId,
      role: 'user',
      content: text,
      run_id: null,
      actions: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        return;
      }

      const res = await fetch('/api/jarvis/thread-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ threadId: activeId, message: text }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível falar com o JARVIS.');
      }
      await loadMessages(activeId);
      await loadThreads();
    } catch {
      setError('Falha de rede ao contactar o JARVIS.');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const archive = async (id: string) => {
    if (!window.confirm('Arquivar esta conversa?')) return;
    try {
      await archiveJarvisThread(id);
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (activeId === id) setActiveId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao arquivar');
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, { nome: string; items: HubJarvisThread[] }>();
    for (const t of threads) {
      const key = t.cliente_id ?? 'sem-cliente';
      const nome = t.cliente?.nome ?? 'Sem cliente';
      if (!map.has(key)) map.set(key, { nome, items: [] });
      map.get(key)!.items.push(t);
    }
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [threads]);

  return (
    <div className={styles.page}>
      <PageHeader badge="IA" title="JARVIS" subtitle="Conversas por cliente e repositório" />

      {error && (
        <div className="error-banner" style={{ marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <button type="button" className={`btn-primary ${styles.newBtn}`} onClick={openNew}>
            + Nova conversa
          </button>
          <div className={styles.threadList}>
            {loadingThreads && <p className={styles.muted}>Carregando…</p>}
            {!loadingThreads && threads.length === 0 && (
              <p className={styles.muted}>Nenhuma conversa ainda.</p>
            )}
            {grouped.map((group) => (
              <div key={group.nome} className={styles.group}>
                <span className={styles.groupLabel}>{group.nome}</span>
                {group.items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.threadItem} ${activeId === t.id ? styles.threadActive : ''}`}
                    onClick={() => setActiveId(t.id)}
                  >
                    <span className={styles.threadTitle}>{t.titulo}</span>
                    {t.repo_url && (
                      <span className={styles.threadRepo}>{t.repo_url.replace(/^https?:\/\//, '')}</span>
                    )}
                    <span
                      className={styles.threadArchive}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        void archive(t.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          void archive(t.id);
                        }
                      }}
                      title="Arquivar"
                      aria-label="Arquivar conversa"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <section className={styles.main}>
          {!activeThread ? (
            <div className={styles.emptyMain}>
              <p>Selecione uma conversa ou crie uma nova para começar.</p>
            </div>
          ) : (
            <>
              <header className={styles.chatHead}>
                <div>
                  <h2 className={styles.chatTitle}>{activeThread.titulo}</h2>
                  <span className={styles.chatMeta}>
                    {activeThread.cliente?.nome ?? 'Sem cliente'}
                    {activeThread.repo_url
                      ? ` · ${activeThread.repo_url.replace(/^https?:\/\//, '')}`
                      : ' · sem repositório'}
                  </span>
                </div>
              </header>

              <div className={styles.messages} ref={listRef}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgAssistant}`}
                  >
                    <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {sending && <p className={styles.typing}>JARVIS está processando via Cursor…</p>}
                {messages.length === 0 && !sending && (
                  <p className={styles.muted}>Mande a primeira mensagem desta conversa.</p>
                )}
              </div>

              <footer className={styles.composer}>
                <textarea
                  className={styles.input}
                  rows={1}
                  placeholder="Pergunte ou peça uma tarefa para o repositório…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={sending}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => void send()}
                  disabled={sending || !draft.trim()}
                >
                  Enviar
                </button>
              </footer>
            </>
          )}
        </section>
      </div>

      {newOpen && (
        <div className={styles.modalBackdrop} role="presentation" onClick={(e) => {
          if (e.target === e.currentTarget) setNewOpen(false);
        }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Nova conversa">
            <h3 className={styles.modalTitle}>Nova conversa</h3>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Cliente</span>
              <select
                className={styles.select}
                value={newConvo.clienteId}
                onChange={(e) => void onSelectCliente(e.target.value)}
              >
                <option value="">Sem cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Repositório</span>
              <select
                className={styles.select}
                value={newConvo.repoId}
                onChange={(e) => setNewConvo((prev) => ({ ...prev, repoId: e.target.value }))}
                disabled={repos.length === 0}
              >
                <option value="">{repos.length ? 'Selecione…' : 'Nenhum cadastrado — use URL abaixo'}</option>
                {repos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} ({r.repo_ref})
                  </option>
                ))}
              </select>
            </label>

            {!newConvo.repoId && (
              <div className={styles.manualRepo}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Ou URL do repositório (manual)</span>
                  <input
                    className={styles.input2}
                    placeholder="https://github.com/org/repo"
                    value={newConvo.repoUrlManual}
                    onChange={(e) => setNewConvo((prev) => ({ ...prev, repoUrlManual: e.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Branch / ref</span>
                  <input
                    className={styles.input2}
                    placeholder="main"
                    value={newConvo.repoRefManual}
                    onChange={(e) => setNewConvo((prev) => ({ ...prev, repoRefManual: e.target.value }))}
                  />
                </label>
              </div>
            )}

            <div className={styles.modalActions}>
              <button type="button" className="btn-ghost" onClick={() => setNewOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={() => void createConvo()}>
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
