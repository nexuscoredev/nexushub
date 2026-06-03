import { useEffect, useRef, useState } from 'react';
import {
  hubChatMensagemEhSolicitacao,
  hubChatMensagemLidaPeloOutro,
  hubChatUrlAssinadaAnexo,
} from '../../lib/hubChat';
import { formatarHoraChat } from '../../lib/hubChatFormat';
import type { HubChatMensagem } from '../../types/hubChat';
import { HubChatAvatar } from './HubChatAvatar';
import styles from './HubChat.module.css';

type Props = {
  meuId: string;
  outroNome: string;
  mensagens: HubChatMensagem[];
  carregando?: boolean;
  enviando: boolean;
  outroLastReadAt?: string | null;
  ocultarSolicitacoes?: boolean;
  onEnviarTexto: (texto: string) => Promise<void>;
  onEnviarFicheiro: (f: File, legenda: string) => Promise<void>;
};

function AnexoMsg({ m }: { m: HubChatMensagem }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!m.anexo_path) return;
    void hubChatUrlAssinadaAnexo(m.anexo_path).then(setUrl);
  }, [m.anexo_path]);

  if (!m.anexo_path) return null;
  const mime = (m.anexo_mime ?? '').toLowerCase();
  const isImg = mime.startsWith('image/');

  return (
    <div className={styles.anexo}>
      {isImg && url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={m.anexo_nome ?? 'Anexo'} className={styles.anexoImg} />
        </a>
      ) : (
        <a href={url ?? '#'} target="_blank" rel="noopener noreferrer" className={styles.anexoLink}>
          📎 {m.anexo_nome ?? 'Anexo'}
        </a>
      )}
      {m.conteudo?.trim() ? <p>{m.conteudo}</p> : null}
    </div>
  );
}

export function HubChatThread({
  meuId,
  outroNome,
  mensagens,
  carregando = false,
  enviando,
  outroLastReadAt = null,
  ocultarSolicitacoes = false,
  onEnviarTexto,
  onEnviarFicheiro,
}: Props) {
  const [texto, setTexto] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const visiveis = ocultarSolicitacoes
    ? mensagens.filter((m) => !hubChatMensagemEhSolicitacao(m.conteudo))
    : mensagens;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visiveis.length, carregando]);

  async function enviarTexto() {
    const t = texto.trim();
    if (!t || enviando) return;
    setTexto('');
    await onEnviarTexto(t);
  }

  function onComposerKey(ev: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      void enviarTexto();
    }
  }

  return (
    <section className={styles.thread} aria-label="Conversa">
      <header className={styles.threadHead}>
        <HubChatAvatar nome={outroNome} size={40} />
        <div className={styles.threadHeadText}>
          <strong>{outroNome}</strong>
          <span className={styles.threadPresenca}>Online</span>
        </div>
      </header>

      <div className={styles.threadScroll} ref={scrollRef}>
        {carregando ? (
          <p className={styles.muted}>A carregar mensagens…</p>
        ) : visiveis.length === 0 ? (
          <p className={styles.muted}>Sem mensagens. Envie a primeira.</p>
        ) : (
          visiveis.map((m) => {
            const mine = m.remetente_id === meuId;
            const lida = mine && hubChatMensagemLidaPeloOutro(m.created_at, outroLastReadAt);
            return (
              <div key={m.id} className={mine ? `${styles.bubbleRow} ${styles.bubbleRowMine}` : styles.bubbleRow}>
                <div className={mine ? `${styles.bubble} ${styles.bubbleMine}` : styles.bubble}>
                  {m.anexo_path ? (
                    <AnexoMsg m={m} />
                  ) : (
                    <p className={styles.bubbleText}>{m.conteudo}</p>
                  )}
                  <span className={styles.bubbleMeta}>
                    {formatarHoraChat(m.created_at)}
                    {lida ? ' · Lida' : null}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className={styles.threadComposer}
        onSubmit={(e) => {
          e.preventDefault();
          void enviarTexto();
        }}
      >
        <input
          ref={fileRef}
          type="file"
          className={styles.fileInput}
          accept="image/*,.pdf,.doc,.docx"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void onEnviarFicheiro(f, texto.trim());
          }}
        />
        <button
          type="button"
          className={styles.attachBtn}
          disabled={enviando}
          aria-label="Anexar ficheiro"
          onClick={() => fileRef.current?.click()}
        >
          +
        </button>
        <textarea
          ref={textareaRef}
          className={styles.threadInput}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onComposerKey}
          placeholder="Mensagem… (Enter envia)"
          disabled={enviando}
          rows={1}
        />
        <button type="submit" className={styles.sendBtn} disabled={enviando || !texto.trim()}>
          Enviar
        </button>
      </form>
    </section>
  );
}
