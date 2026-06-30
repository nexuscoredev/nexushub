import { useEffect, useRef, useState } from 'react';
import {
  getDemoChatReply,
  getDemoChatSuggestions,
  getDemoChatWelcome,
  type DemoChatMessage,
} from '../data/sistemaDemoChat';
import type { DemoId } from '../data/sistemaDemoCatalog';
import styles from './SistemaDemoChat.module.css';

interface SistemaDemoChatProps {
  demoId: DemoId;
}

export function SistemaDemoChat({ demoId }: SistemaDemoChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<DemoChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const suggestions = getDemoChatSuggestions(demoId);

  useEffect(() => {
    if (!open || messages.length > 0) return;
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text: getDemoChatWelcome(demoId),
      },
    ]);
  }, [demoId, messages.length, open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const sendUserMessage = (text: string, directReply?: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', text: trimmed }]);
    setInput('');
    setTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: directReply ?? getDemoChatReply(demoId, trimmed),
        },
      ]);
      setTyping(false);
    }, 700);
  };

  return (
    <div className={styles.root}>
      {open ? (
        <section className={styles.panel} aria-label="Assistente da demonstração">
          <header className={styles.head}>
            <div>
              <span className={styles.headTitle}>
                <span className="material-symbols-outlined" aria-hidden>
                  smart_toy
                </span>
                Assistente demo
              </span>
              <span className={styles.headMeta}>Portfólio NEXUS · respostas automáticas</span>
            </div>
            <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Fechar chat">
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
            </button>
          </header>

          <div className={styles.messages} ref={listRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.bubble} ${msg.role === 'bot' ? styles.bubbleBot : styles.bubbleUser}`}
              >
                {msg.text}
              </div>
            ))}
            {typing ? (
              <div className={styles.typing} aria-label="Digitando">
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </div>

          <div className={styles.suggestions}>
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.suggestionBtn}
                onClick={() => sendUserMessage(item.label, item.reply)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              sendUserMessage(input);
            }}
          >
            <input
              className={styles.input}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pergunte sobre a demonstração…"
              disabled={typing}
            />
            <button type="submit" className={styles.sendBtn} disabled={!input.trim() || typing} aria-label="Enviar">
              <span className="material-symbols-outlined" aria-hidden>
                send
              </span>
            </button>
          </form>
        </section>
      ) : null}

      <button type="button" className={styles.toggleBtn} onClick={() => setOpen((value) => !value)}>
        <span className="material-symbols-outlined" aria-hidden>
          {open ? 'expand_more' : 'chat'}
        </span>
        {open ? 'Fechar assistente' : 'Assistente demo'}
      </button>
    </div>
  );
}
