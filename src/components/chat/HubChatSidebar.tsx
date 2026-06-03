import { formatarHoraCurta, formatarPreviewLista } from '../../lib/hubChatFormat';
import type { HubChatConversaLista, HubChatUsuarioLista } from '../../types/hubChat';
import { HubChatAvatar } from './HubChatAvatar';
import styles from './HubChat.module.css';

type Props = {
  meuId: string;
  tab: 'conversas' | 'pessoas';
  onTab: (t: 'conversas' | 'pessoas') => void;
  busca: string;
  onBusca: (v: string) => void;
  conversas: HubChatConversaLista[];
  usuariosFiltrados: HubChatUsuarioLista[];
  totalUsuarios: number;
  usuariosPorId: Map<string, HubChatUsuarioLista>;
  conversaSelecionadaId: string | null;
  onSelectConversa: (id: string) => void;
  onStartComUsuario: (userId: string) => void;
  carregando: boolean;
};

export function HubChatSidebar({
  meuId,
  tab,
  onTab,
  busca,
  onBusca,
  conversas,
  usuariosFiltrados,
  totalUsuarios,
  usuariosPorId,
  conversaSelecionadaId,
  onSelectConversa,
  onStartComUsuario,
  carregando,
}: Props) {
  return (
    <aside className={styles.sidebar} aria-label="Conversas e contactos">
      <div className={styles.sidebarTabs}>
        <button
          type="button"
          className={tab === 'conversas' ? `${styles.tab} ${styles.tabOn}` : styles.tab}
          onClick={() => onTab('conversas')}
        >
          Conversas
        </button>
        <button
          type="button"
          className={tab === 'pessoas' ? `${styles.tab} ${styles.tabOn}` : styles.tab}
          onClick={() => onTab('pessoas')}
        >
          Pessoas
        </button>
      </div>
      <div className={styles.sidebarSearch}>
        <input
          type="search"
          className={styles.input}
          placeholder={tab === 'conversas' ? 'Filtrar por nome…' : 'Buscar por nome, e-mail ou cargo…'}
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
          aria-label={tab === 'conversas' ? 'Filtrar conversas' : 'Buscar utilizador'}
        />
        {tab === 'pessoas' && !carregando && totalUsuarios > 0 ? (
          <p className={styles.sidebarHint}>
            {totalUsuarios} utilizador{totalUsuarios === 1 ? '' : 'es'} ativo
            {totalUsuarios === 1 ? '' : 's'} · toque para abrir a conversa
          </p>
        ) : null}
      </div>
      <div className={styles.sidebarList}>
        {carregando ? (
          <p className={styles.muted}>A carregar…</p>
        ) : tab === 'conversas' ? (
          conversas.length === 0 ? (
            <p className={styles.muted}>Nenhuma conversa ainda. Abra um contacto em «Pessoas».</p>
          ) : (
            conversas.map((c) => {
              const u = usuariosPorId.get(c.outro_id) ?? c.outro;
              const nome = u?.nome || u?.email || 'Utilizador';
              const preview = formatarPreviewLista(c.ultima_preview, c.ultima_remetente_id, meuId);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={
                    conversaSelecionadaId === c.id ? `${styles.row} ${styles.rowActive}` : styles.row
                  }
                  onClick={() => onSelectConversa(c.id)}
                >
                  <HubChatAvatar nome={nome} />
                  <span className={styles.rowBody}>
                    <span className={styles.rowTop}>
                      <span className={styles.rowNome}>{nome}</span>
                      <span className={styles.rowHora}>{formatarHoraCurta(c.ultima_em)}</span>
                    </span>
                    <span className={styles.rowBottom}>
                      <span className={styles.rowPreview}>{preview}</span>
                      {c.unread > 0 ? (
                        <span className={styles.badge}>{c.unread > 99 ? '99+' : c.unread}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className={`${styles.dot} ${styles.dotOn}`} title="Online" aria-hidden />
                </button>
              );
            })
          )
        ) : usuariosFiltrados.length === 0 ? (
          <p className={styles.muted}>
            {totalUsuarios === 0
              ? 'Não há outros utilizadores ativos.'
              : busca.trim()
                ? 'Nenhum resultado para esta busca.'
                : 'Nenhum utilizador na lista.'}
          </p>
        ) : (
          usuariosFiltrados.map((u) => {
            const rotulo = u.nome.trim() || u.email;
            return (
              <button
                key={u.id}
                type="button"
                className={styles.row}
                onClick={() => onStartComUsuario(u.id)}
              >
                <HubChatAvatar nome={rotulo} />
                <span className={styles.rowBody}>
                  <span className={styles.rowTop}>
                    <span className={styles.rowNome}>{rotulo}</span>
                    <span className={styles.rowCargo}>{u.cargo || '—'}</span>
                  </span>
                  <span className={styles.rowEmail}>{u.email}</span>
                </span>
                <span className={`${styles.dot} ${styles.dotOn}`} title="Online" aria-hidden />
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
