import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  hubChatCarregarConversas,
  hubChatCarregarMensagens,
  hubChatEnviarAnexo,
  hubChatEnviarTexto,
  hubChatGetOrCreateDirect,
  hubChatListarSolicitacoesFila,
  hubChatListarUsuariosAtivos,
  hubChatMarcarLida,
  hubChatObterLastReadAt,
  hubChatTabelasIndisponiveis,
} from '../../lib/hubChat';
import { hubChatVeColunaSolicitacoes, hubChatPodeGerirChat } from '../../lib/hubChatPermissions';
import { supabase } from '../../lib/supabase';
import type { HubProfile } from '../../types/database';
import type { HubChatConversaLista, HubChatSolicitacaoFilaItem, HubChatUsuarioLista } from '../../types/hubChat';
import { HubChatSidebar } from './HubChatSidebar';
import { HubChatSolicitacoes } from './HubChatSolicitacoes';
import { HubChatThread } from './HubChatThread';
import {
  HUB_CHAT_HEAD_THEME_IDS,
  HUB_CHAT_HEAD_THEMES,
  type HubChatHeadThemeId,
} from './hubChatThemes';
import styles from './HubChat.module.css';

const THEME_STORAGE_KEY = 'nexus-hub-chat-head-theme';

function parseTheme(raw: string | null): HubChatHeadThemeId {
  if (raw && HUB_CHAT_HEAD_THEME_IDS.includes(raw as HubChatHeadThemeId)) {
    return raw as HubChatHeadThemeId;
  }
  return 'prata';
}

function filtrar<T>(itens: T[], busca: string, texto: (item: T) => string): T[] {
  const q = busca.trim().toLowerCase();
  if (!q) return itens;
  return itens.filter((i) => texto(i).toLowerCase().includes(q));
}

type Props = {
  profile: HubProfile;
  pendingPeerId?: string | null;
  onPendingPeerHandled?: () => void;
  onFechar: () => void;
  onNaoLidasChange?: (n: number) => void;
};

export function HubChatWidget({
  profile,
  pendingPeerId,
  onPendingPeerHandled,
  onFechar,
  onNaoLidasChange,
}: Props) {
  const meuId = profile.id;
  const veColunaSolicitacoes = hubChatVeColunaSolicitacoes(profile.cargo);
  const podeGerir = hubChatPodeGerirChat(profile.cargo);

  const [erro, setErro] = useState('');
  const [tab, setTab] = useState<'conversas' | 'pessoas'>('conversas');
  const [busca, setBusca] = useState('');
  const [usuarios, setUsuarios] = useState<HubChatUsuarioLista[]>([]);
  const [conversas, setConversas] = useState<HubChatConversaLista[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<HubChatSolicitacaoFilaItem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [carregandoSolic, setCarregandoSolic] = useState(false);

  const [conversaId, setConversaId] = useState<string | null>(null);
  const [outroId, setOutroId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Awaited<ReturnType<typeof hubChatCarregarMensagens>>>([]);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [outroLastReadAt, setOutroLastReadAt] = useState<string | null>(null);
  const [abrindoPessoa, setAbrindoPessoa] = useState(false);

  const [tema, setTema] = useState<HubChatHeadThemeId>(() =>
    typeof window !== 'undefined' ? parseTheme(localStorage.getItem(THEME_STORAGE_KEY)) : 'prata',
  );
  const [menuTemaAberto, setMenuTemaAberto] = useState(false);
  const menuTemaRef = useRef<HTMLDivElement>(null);

  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  const conversasFiltradas = useMemo(
    () =>
      filtrar(conversas, busca, (c) => {
        const u = usuariosPorId.get(c.outro_id) ?? c.outro;
        return [u?.nome, u?.cargo, c.ultima_preview].filter(Boolean).join(' ');
      }),
    [conversas, busca, usuariosPorId],
  );

  const usuariosFiltrados = useMemo(
    () => filtrar(usuarios, busca, (u) => [u.nome, u.cargo, u.email].join(' ')),
    [usuarios, busca],
  );

  const outroMeta = useMemo(() => {
    if (!outroId) return null;
    return usuariosPorId.get(outroId) ?? conversas.find((c) => c.outro_id === outroId)?.outro ?? null;
  }, [outroId, usuariosPorId, conversas]);

  const outroNome = outroMeta?.nome?.trim() || outroMeta?.email || 'Utilizador';
  const mostrarThread = Boolean(conversaId && outroId);

  const recarregarConversas = useCallback(async () => {
    const [conv, users] = await Promise.all([
      hubChatCarregarConversas(),
      hubChatListarUsuariosAtivos(meuId),
    ]);
    setConversas(conv);
    setUsuarios(users);
    onNaoLidasChange?.(conv.reduce((s, c) => s + c.unread, 0));
  }, [meuId, onNaoLidasChange]);

  const recarregarSolicitacoes = useCallback(async () => {
    if (!veColunaSolicitacoes) return;
    setCarregandoSolic(true);
    try {
      const itens = await hubChatListarSolicitacoesFila(meuId);
      setSolicitacoes(itens);
    } catch {
      setSolicitacoes([]);
    } finally {
      setCarregandoSolic(false);
    }
  }, [meuId, veColunaSolicitacoes]);

  const recarregarTudo = useCallback(async () => {
    setCarregandoLista(true);
    setErro('');
    try {
      await Promise.all([recarregarConversas(), recarregarSolicitacoes()]);
    } catch (e) {
      if (hubChatTabelasIndisponiveis(e)) {
        setErro(
          'Chat não configurado no Supabase. Rode a migration 20260612120000_hub_chat_interno.sql.',
        );
      } else {
        setErro(e instanceof Error ? e.message : 'Erro ao carregar chat.');
      }
    } finally {
      setCarregandoLista(false);
    }
  }, [recarregarConversas, recarregarSolicitacoes]);

  const abrirConversa = useCallback(
    async (id: string, opts?: { outroId?: string }) => {
      setConversaId(id);
      const conv = conversas.find((c) => c.id === id);
      const oid = opts?.outroId ?? conv?.outro_id ?? null;
      setOutroId(oid);
      setTab('conversas');
    },
    [conversas],
  );

  const iniciarComUsuario = useCallback(
    async (peerId: string) => {
      setAbrindoPessoa(true);
      setErro('');
      try {
        const id = await hubChatGetOrCreateDirect(peerId);
        await recarregarConversas();
        await abrirConversa(id, { outroId: peerId });
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Não foi possível abrir a conversa.');
      } finally {
        setAbrindoPessoa(false);
      }
    },
    [abrirConversa, recarregarConversas],
  );

  const carregarMensagens = useCallback(async () => {
    if (!conversaId || !outroId) return;
    setCarregandoMensagens(true);
    try {
      const msgs = await hubChatCarregarMensagens(conversaId);
      setMensagens(msgs);
      await hubChatMarcarLida(conversaId);
      setOutroLastReadAt(await hubChatObterLastReadAt(conversaId, outroId));
      await recarregarConversas();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar mensagens.');
    } finally {
      setCarregandoMensagens(false);
    }
  }, [conversaId, outroId, recarregarConversas]);

  useEffect(() => {
    void recarregarTudo();
  }, [recarregarTudo]);

  useEffect(() => {
    void carregarMensagens();
  }, [carregarMensagens]);

  useEffect(() => {
    const client = supabase;
    if (!conversaId || !client) return;
    const ch = client
      .channel(`hub-chat-thread-${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hub_chat_mensagens',
          filter: `conversa_id=eq.${conversaId}`,
        },
        () => void carregarMensagens(),
      )
      .subscribe();
    return () => {
      void client.removeChannel(ch);
    };
  }, [conversaId, carregarMensagens]);

  useEffect(() => {
    if (!pendingPeerId || pendingPeerId === meuId) {
      onPendingPeerHandled?.();
      return;
    }
    let cancel = false;
    void iniciarComUsuario(pendingPeerId).finally(() => {
      if (!cancel) onPendingPeerHandled?.();
    });
    return () => {
      cancel = true;
    };
  }, [pendingPeerId, meuId, iniciarComUsuario, onPendingPeerHandled]);

  useEffect(() => {
    if (!menuTemaAberto) return;
    const onDown = (e: MouseEvent) => {
      if (menuTemaRef.current && !menuTemaRef.current.contains(e.target as Node)) {
        setMenuTemaAberto(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuTemaAberto]);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key !== 'Escape') return;
      if (menuTemaAberto) {
        setMenuTemaAberto(false);
        return;
      }
      onFechar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFechar, menuTemaAberto]);

  const headNeve = tema === 'neve';

  return (
    <div className={styles.hcOpen}>
      <div className={styles.hcBackdrop} aria-hidden onClick={onFechar} />
      <div
        className={`${styles.sheet} ${veColunaSolicitacoes ? styles.sheetComFila : ''}`}
        role="dialog"
        aria-label="Chat interno NEXUS"
      >
        <header
          className={`${styles.sheetHead} ${headNeve ? styles.sheetHeadNeve : ''}`}
          style={{ background: HUB_CHAT_HEAD_THEMES[tema].gradient }}
        >
          <h2 className={styles.sheetTitle}>CHAT INTERNO</h2>
          <div className={styles.headLogoWrap}>
            <img className={styles.headLogo} src="/logo-nexus-mark.svg" alt="NEXUS" decoding="async" />
          </div>
          <div className={styles.headActions}>
            <div className={styles.headMenuWrap} ref={menuTemaRef}>
              <button
                type="button"
                className={styles.headBtn}
                aria-label="Cor do cabeçalho"
                aria-expanded={menuTemaAberto}
                onClick={() => setMenuTemaAberto((v) => !v)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="6" r="1.85" />
                  <circle cx="12" cy="12" r="1.85" />
                  <circle cx="12" cy="18" r="1.85" />
                </svg>
              </button>
              {menuTemaAberto ? (
                <ul className={styles.themeMenu} role="menu">
                  {HUB_CHAT_HEAD_THEME_IDS.map((id) => (
                    <li key={id} role="none">
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={tema === id}
                        className={styles.themeOption}
                        onClick={() => {
                          setTema(id);
                          setMenuTemaAberto(false);
                          try {
                            localStorage.setItem(THEME_STORAGE_KEY, id);
                          } catch {
                            /* ignore */
                          }
                        }}
                      >
                        <span
                          className={styles.themeSwatch}
                          style={{ background: HUB_CHAT_HEAD_THEMES[id].gradient }}
                          aria-hidden
                        />
                        {HUB_CHAT_HEAD_THEMES[id].label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button type="button" className={styles.headBtn} aria-label="Fechar chat" onClick={onFechar}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {erro ? <div className={styles.alert}>{erro}</div> : null}

        <div className={styles.shell}>
          <HubChatSidebar
            meuId={meuId}
            tab={tab}
            onTab={setTab}
            busca={busca}
            onBusca={setBusca}
            conversas={conversasFiltradas}
            usuariosFiltrados={usuariosFiltrados}
            totalUsuarios={usuarios.length}
            usuariosPorId={usuariosPorId}
            conversaSelecionadaId={conversaId}
            onSelectConversa={(id) => void abrirConversa(id)}
            onStartComUsuario={(id) => void iniciarComUsuario(id)}
            carregando={carregandoLista || abrindoPessoa}
          />

          {veColunaSolicitacoes ? (
            <HubChatSolicitacoes
              itens={solicitacoes}
              carregando={carregandoSolic}
              onAbrirConversa={(cid, oid) => void abrirConversa(cid, { outroId: oid })}
            />
          ) : null}

          {mostrarThread ? (
            <HubChatThread
              meuId={meuId}
              outroNome={outroNome}
              mensagens={mensagens}
              carregando={carregandoMensagens}
              enviando={enviando}
              outroLastReadAt={outroLastReadAt}
              ocultarSolicitacoes={podeGerir}
              onEnviarTexto={async (texto) => {
                if (!conversaId) return;
                setEnviando(true);
                try {
                  await hubChatEnviarTexto(conversaId, texto);
                  await carregarMensagens();
                  await recarregarSolicitacoes();
                } catch (e) {
                  setErro(e instanceof Error ? e.message : 'Erro ao enviar.');
                  throw e;
                } finally {
                  setEnviando(false);
                }
              }}
              onEnviarFicheiro={async (f, legenda) => {
                if (!conversaId) return;
                setEnviando(true);
                try {
                  await hubChatEnviarAnexo(conversaId, f, legenda);
                  await carregarMensagens();
                } catch (e) {
                  setErro(e instanceof Error ? e.message : 'Erro ao enviar anexo.');
                } finally {
                  setEnviando(false);
                }
              }}
            />
          ) : (
            <div className={styles.emptyMain}>
              <p>Seleccione uma conversa ou escolha uma pessoa para começar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
