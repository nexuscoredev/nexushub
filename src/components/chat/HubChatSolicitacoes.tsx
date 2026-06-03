import { useMemo, useState } from 'react';
import type { HubChatSolicitacaoFilaItem } from '../../types/hubChat';
import { HubChatAvatar } from './HubChatAvatar';
import styles from './HubChat.module.css';

type Aba = 'fila' | 'negados' | 'historico';

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hoje = new Date();
  const mesmoDia =
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear();
  if (mesmoDia) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = {
  itens: HubChatSolicitacaoFilaItem[];
  carregando: boolean;
  onAbrirConversa: (conversaId: string, outroId: string) => void;
};

export function HubChatSolicitacoes({ itens, carregando, onAbrirConversa }: Props) {
  const [aba, setAba] = useState<Aba>('fila');

  const vazios = useMemo(
    () => ({
      fila: 'Nenhum pedido novo na fila',
      negados: 'Nenhum pedido negado',
      historico: 'Nenhum registo no histórico',
    }),
    [],
  );

  return (
    <aside className={styles.pedidosCol} aria-label="Solicitações">
      <div className={styles.pedidosHead}>
        <h3 className={styles.pedidosTitle}>Solicitações</h3>
        <a className={styles.pedidosRelatorio} href="/fila" target="_blank" rel="noopener noreferrer">
          Fila NEXUS
        </a>
      </div>
      <div className={styles.pedidosTabsWrap}>
        <div className={styles.pedidosTabs}>
          {(['fila', 'negados', 'historico'] as Aba[]).map((t) => (
            <button
              key={t}
              type="button"
              className={aba === t ? `${styles.pedidosTab} ${styles.pedidosTabOn}` : styles.pedidosTab}
              onClick={() => setAba(t)}
            >
              {t === 'fila' ? 'Fila' : t === 'negados' ? 'Negados' : 'Histórico'}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.pedidosSub}>
        {aba === 'fila'
          ? 'Pedidos novos à espera da sua resposta'
          : aba === 'negados'
            ? 'Pedidos recusados pelo solicitante'
            : 'Histórico de pedidos tratados'}
      </p>
      <div className={styles.pedidosList}>
        {carregando ? (
          <p className={styles.muted}>A carregar…</p>
        ) : aba !== 'fila' ? (
          <div className={styles.pedidosEmpty}>
            <p>{vazios[aba]}</p>
          </div>
        ) : itens.length === 0 ? (
          <div className={styles.pedidosEmpty}>
            <p>{vazios.fila}</p>
          </div>
        ) : (
          itens.map((item) => (
            <button
              key={item.mensagem_id}
              type="button"
              className={styles.pedidosCard}
              onClick={() => onAbrirConversa(item.conversa_id, item.remetente_id)}
            >
              <HubChatAvatar nome={item.solicitante_nome} size={40} />
              <span className={styles.pedidosCardBody}>
                <strong>{item.solicitante_nome}</strong>
                <span>{item.preview}</span>
                <time dateTime={item.created_at}>{formatarDataHora(item.created_at)}</time>
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
