import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HubLogo } from '../HubLogo';
import {
  hubChatCarregarConversas,
  hubChatCarregarMensagens,
  hubChatEnviarTexto,
  hubChatGetOrCreateDirect,
  hubChatListarUsuariosAtivos,
  hubChatMarcarLida,
  hubChatTabelasIndisponiveis,
} from '../../lib/hubChat';
import {
  blocosMensagensComDia,
  formatarHoraChat,
  previewLista,
} from '../../lib/hubChatFormat';
import { supabase } from '../../lib/supabase';
import type { HubProfile } from '../../types/database';
import type { HubChatConversaLista, HubChatUsuarioLista } from '../../types/hubChat';
import styles from './HubChat.module.css';

type Aba = 'conversas' | 'pessoas';
type PainelMobile = 'lista' | 'thread';

function iniciais(nome: string): string {
  const p = nome.trim().charAt(0);
  return p ? p.toUpperCase() : '?';
}

function filtrar<T>(itens: T[], busca: string, texto: (item: T) => string): T[] {
  const q = busca.trim().toLowerCase();
  if (!q) return itens;
  return itens.filter((i) => texto(i).toLowerCase().includes(q));
}

export function HubChatWidget({
  profile,
  pendingPeerId,
  onPendingPeerHandled,
  onFechar,
  onNaoLidasChange,
}: {
  profile: HubProfile;
  pendingPeerId?: string | null;
  onPendingPeerHandled?: () => void;
  onFechar: () => void;
  onNaoLidasChange?: (n: number) => void;
}) {
  const meuId = profile.id;
  const [aba, setAba] = useState<Aba>('conversas');
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [mobilePainel, setMobilePainel] = useState<PainelMobile>('lista');
  const [conversas, setConversas] = useState<HubChatConversaLista[]>([]);
  const [usuarios, setUsuarios] = useState<HubChatUsuarioLista[]>([]);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Awaited<ReturnType<typeof hubChatCarregarMensagens>>>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const conversaAtual = useMemo(
    () => conversas.find((c) => c.id === conversaId) ?? null,
    [conversas, conversaId],
  );

  const conversasFiltradas = useMemo(
    () =>
      filtrar(conversas, busca, (c) =>
        [c.outro?.nome, c.outro?.cargo, c.ultima_preview].filter(Boolean).join(' '),
      ),
    [conversas, busca],
  );

  const usuariosFiltrados = useMemo(
    () => filtrar(usuarios, busca, (u) => [u.nome, u.cargo, u.email].join(' ')),
    [usuarios, busca],
  );

  const blocos = useMemo(() => blocosMensagensComDia(mensagens), [mensagens]);

  const atualizarLista = useCallback(async () => {
    try {
      const [conv, users] = await Promise.all([
        hubChatCarregarConversas(),
        hubChatListarUsuariosAtivos(meuId),
      ]);
      setConversas(conv);
      setUsuarios(users);
      setErro(null);
      onNaoLidasChange?.(conv.reduce((s, c) => s + c.unread, 0));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar chat.';
      setErro(msg);
      if (!hubChatTabelasIndisponiveis(e)) console.error(e);
    }
  }, [meuId, onNaoLidasChange]);

  const carregarThread = useCallback(async () => {
    if (!conversaId) return;
    try {
      const msgs = await hubChatCarregarMensagens(conversaId);
      setMensagens(msgs);
      await hubChatMarcarLida(conversaId);
      setErro(null);
      await atualizarLista();
      queueMicrotask(() => fimRef.current?.scrollIntoView({ block: 'end' }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar mensagens.');
    }
  }, [conversaId, atualizarLista]);

  useEffect(() => {
    setCarregando(true);
    void atualizarLista().finally(() => setCarregando(false));
  }, [atualizarLista]);

  useEffect(() => {
    void carregarThread();
  }, [carregarThread]);

  useEffect(() => {
    if (!conversaId || !supabase) return;
    const ch = supabase
      .channel(`hub-chat-${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hub_chat_mensagens',
          filter: `conversa_id=eq.${conversaId}`,
        },
        () => void carregarThread(),
      )
      .subscribe();
    return () => {
      if (supabase) void supabase.removeChannel(ch);
    };
  }, [conversaId, carregarThread]);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel('hub-chat-inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hub_chat_mensagens' },
        () => void atualizarLista(),
      )
      .subscribe();
    return () => {
      if (supabase) void supabase.removeChannel(ch);
    };
  }, [atualizarLista]);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onFechar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFechar]);

  useEffect(() => {
    if (!pendingPeerId || pendingPeerId === meuId) {
      onPendingPeerHandled?.();
      return;
    }
    let cancel = false;
    void (async () => {
      try {
        const id = await hubChatGetOrCreateDirect(pendingPeerId);
        if (cancel) return;
        await atualizarLista();
        setConversaId(id);
        setAba('conversas');
        if (mobile) setMobilePainel('thread');
      } catch (e) {
        if (!cancel) setErro(e instanceof Error ? e.message : 'Erro ao abrir conversa.');
      } finally {
        if (!cancel) onPendingPeerHandled?.();
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pendingPeerId, meuId, atualizarLista, onPendingPeerHandled, mobile]);

  function selecionarConversa(id: string) {
    setConversaId(id);
    if (mobile) setMobilePainel('thread');
  }

  async function abrirComUsuario(peerId: string) {
    try {
      const id = await hubChatGetOrCreateDirect(peerId);
      await atualizarLista();
      selecionarConversa(id);
      setAba('conversas');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao abrir conversa.');
    }
  }

  async function enviar() {
    if (!conversaId || enviando) return;
    const body = texto.trim();
    if (!body) return;
    setEnviando(true);
    setTexto('');
    try {
      await hubChatEnviarTexto(conversaId, body);
      await carregarThread();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar.');
      setTexto(body);
    } finally {
      setEnviando(false);
    }
  }

  function onComposerKey(ev: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      void enviar();
    }
  }

  const mostrarLista = !mobile || mobilePainel === 'lista';
  const mostrarThread = !mobile || mobilePainel === 'thread';

  return (
    <div className={styles.shell} role="dialog" aria-label="Chat interno NEXUS">
      <header className={styles.header}>
        <HubLogo size="sm" showSubtitle={false} />
        <div className={styles.headerTitle}>
          <strong>Chat interno</strong>
          <span>{profile.nome}</span>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => void atualizarLista()}
          aria-label="Atualizar"
          title="Atualizar"
        >
          ↻
        </button>
        <button type="button" className={styles.iconBtn} onClick={onFechar} aria-label="Fechar">
          ✕
        </button>
      </header>

      {erro ? <div className={styles.erro}>{erro}</div> : null}

      <div className={`${styles.body} ${mobile ? styles.bodyMobile : ''}`}>
        {mostrarLista ? (
          <aside className={`${styles.listPane} ${mobile && mobilePainel === 'thread' ? styles.hideOnMobile : ''}`}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${aba === 'conversas' ? styles.tabActive : ''}`}
                onClick={() => setAba('conversas')}
              >
                Conversas
              </button>
              <button
                type="button"
                className={`${styles.tab} ${aba === 'pessoas' ? styles.tabActive : ''}`}
                onClick={() => setAba('pessoas')}
              >
                Pessoas
              </button>
            </div>
            <label className={styles.search}>
              <span className={styles.visuallyHidden}>Buscar</span>
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={aba === 'pessoas' ? 'Buscar pessoa…' : 'Buscar conversa…'}
              />
            </label>
            <div className={styles.list}>
              {carregando && !conversas.length && !usuarios.length ? (
                <p className={styles.empty}>Carregando…</p>
              ) : null}
              {aba === 'conversas' ? (
                conversasFiltradas.length === 0 ? (
                  <p className={styles.empty}>Nenhuma conversa. Abra em Pessoas.</p>
                ) : (
                  conversasFiltradas.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.listItem} ${c.id === conversaId ? styles.listItemActive : ''}`}
                      onClick={() => selecionarConversa(c.id)}
                    >
                      <span className={styles.avatar}>{iniciais(c.outro?.nome ?? '?')}</span>
                      <span className={styles.listMeta}>
                        <strong>{c.outro?.nome ?? 'Utilizador'}</strong>
                        <span>{previewLista(c.ultima_preview)}</span>
                      </span>
                      {c.ultima_em ? (
                        <span className={styles.listTime}>{formatarHoraChat(c.ultima_em)}</span>
                      ) : null}
                      {c.unread > 0 ? <span className={styles.unreadDot} aria-label="Não lida" /> : null}
                    </button>
                  ))
                )
              ) : usuariosFiltrados.length === 0 ? (
                <p className={styles.empty}>Nenhum utilizador ativo.</p>
              ) : (
                usuariosFiltrados.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={styles.listItem}
                    onClick={() => void abrirComUsuario(u.id)}
                  >
                    <span className={styles.avatar}>{iniciais(u.nome)}</span>
                    <span className={styles.listMeta}>
                      <strong>{u.nome}</strong>
                      <span>{u.cargo}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>
        ) : null}

        {mostrarThread ? (
          <section
            className={`${styles.threadPane} ${mobile && mobilePainel === 'lista' ? styles.hideOnMobile : ''}`}
          >
            {mobile ? (
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setMobilePainel('lista')}
              >
                ← Conversas
              </button>
            ) : null}
            <div className={styles.threadHead}>
              {conversaAtual?.outro?.nome ?? 'Selecione uma conversa'}
            </div>
            <div className={styles.messages}>
              {!conversaId ? (
                <p className={styles.messagesEmpty}>
                  Escolha uma conversa na lista
                  <br />
                  ou abra alguém em <strong>Pessoas</strong>.
                </p>
              ) : (
                blocos.map((b) =>
                  b.tipo === 'dia' ? (
                    <span key={b.chave} className={styles.dayLabel}>
                      {b.rotulo}
                    </span>
                  ) : (
                    <div
                      key={b.mensagem.id}
                      className={`${styles.bubbleRow} ${b.mensagem.remetente_id === meuId ? styles.bubbleRowMine : ''}`}
                    >
                      <div
                        className={`${styles.bubble} ${b.mensagem.remetente_id === meuId ? styles.bubbleMine : ''}`}
                      >
                        {b.mensagem.conteudo}
                        <span className={styles.bubbleTime}>
                          {formatarHoraChat(b.mensagem.created_at)}
                        </span>
                      </div>
                    </div>
                  ),
                )
              )}
              <div ref={fimRef} />
            </div>
            {conversaId ? (
              <div className={styles.composer}>
                <div className={styles.composerField}>
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={onComposerKey}
                    placeholder="Escreva uma mensagem… (Enter envia)"
                    disabled={enviando}
                    rows={1}
                    aria-label="Mensagem"
                  />
                </div>
                <button
                  type="button"
                  className={styles.sendBtn}
                  disabled={enviando || !texto.trim()}
                  onClick={() => void enviar()}
                >
                  Enviar
                </button>
              </div>
            ) : (
              <div className={styles.composerHint}>
                O campo de mensagem aparece quando você selecionar uma conversa.
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
