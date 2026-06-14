import { useEffect, useRef, useState } from 'react';
import { useJarvisChat } from '../../hooks/useJarvisChat';
import type { HubPersonalTransaction } from '../../types/database';
import styles from './Jarvis.module.css';

const QUICK_PROMPTS = [
  'O que tenho a pagar este mês?',
  'Como está meu humor hoje?',
  'Resumo das minhas finanças',
  'Abrir área pessoal',
] as const;

interface JarvisWidgetProps {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  userName: string;
  rows: HubPersonalTransaction[];
  onRowsChanged: () => void;
}

export function JarvisWidget({
  open,
  onClose,
  userId,
  userName,
  rows,
  onRowsChanged,
}: JarvisWidgetProps) {
  const firstName = userName.trim().split(/\s+/)[0] || 'chefe';
  const { messages, loading, error, configured, sendMessage, reset } = useJarvisChat({
    userId,
    userName,
    rows,
    onRowsChanged,
  });
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void sendMessage(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (!open) return null;

  return (
    <div className={`${styles.jarvisLayer} ${styles.jarvisOpen}`} role="presentation">
      <button type="button" className={styles.jarvisBackdrop} onClick={onClose} aria-label="Fechar JARVIS" />
      <section className={styles.panel} aria-label="JARVIS — assistente pessoal">
        <header className={styles.head}>
          <div className={styles.headTitle}>
            <span className={styles.headName}>Jarvis</span>
            <span className={styles.headSub}>Assistente pessoal · área privada</span>
          </div>
          <div className={styles.headActions}>
            <button type="button" className={styles.iconBtn} onClick={reset} title="Nova conversa" aria-label="Nova conversa">
              ↺
            </button>
            <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Fechar">
              ×
            </button>
          </div>
        </header>

        {configured === false && (
          <p className={styles.alert}>
            JARVIS aguarda configuração da chave OPENAI_API_KEY no servidor (Vercel).
          </p>
        )}

        {error && <p className={styles.alert}>{error}</p>}

        <div className={styles.body} ref={listRef}>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <p>
                À sua disposição, {firstName}. Posso revisar contas pendentes, humor do dia, saldo do mês ou
                executar ações na sua área pessoal — de forma discreta, como sempre.
              </p>
              <div className={styles.chips}>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className={styles.chip}
                    onClick={() => void sendMessage(prompt)}
                    disabled={loading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.msg} ${msg.role === 'user' ? styles.msgUser : styles.msgAssistant}`}
              >
                <div
                  className={`${styles.bubble} ${
                    msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant
                  }`}
                >
                  {msg.content}
                </div>
                {msg.actionsExecuted?.map((line) => (
                  <span key={line} className={styles.actionsDone}>
                    ✓ {line}
                  </span>
                ))}
              </div>
            ))
          )}
          {loading && <p className={styles.typing}>JARVIS está pensando…</p>}
        </div>

        <footer className={styles.foot}>
          <textarea
            ref={inputRef}
            className={styles.input}
            rows={1}
            placeholder="Pergunte ou peça uma ação…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
            aria-label="Mensagem para o JARVIS"
          />
          <button type="button" className={styles.sendBtn} onClick={submit} disabled={loading || !draft.trim()}>
            Enviar
          </button>
        </footer>
      </section>
    </div>
  );
}
