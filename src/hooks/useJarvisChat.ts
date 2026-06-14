import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildJarvisContext } from '../lib/jarvisContext';
import { executeJarvisActions } from '../lib/jarvisActions';
import { supabase } from '../lib/supabase';
import type { HubPersonalTransaction } from '../types/database';
import type { JarvisChatResponse, JarvisMessage } from '../types/jarvis';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useJarvisChat(opts: {
  userId: string | undefined;
  userName: string;
  rows: HubPersonalTransaction[];
  onRowsChanged?: () => void;
}) {
  const { userId, userName, rows, onRowsChanged } = opts;
  const navigate = useNavigate();
  const [messages, setMessages] = useState<JarvisMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: JarvisMessage = { id: newId(), role: 'user', content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setLoading(true);
      setError(null);

      try {
        const session = await supabase?.auth.getSession();
        const token = session?.data.session?.access_token;
        if (!token) {
          setError('Sessão expirada. Faça login novamente.');
          return;
        }

        const context = buildJarvisContext(rows, userId, userName);
        const res = await fetch('/api/jarvis/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
            context,
          }),
        });

        const data = (await res.json()) as JarvisChatResponse & { error?: string };

        if (!res.ok) {
          if (data.configured === false) setConfigured(false);
          setError(data.error ?? 'Não foi possível falar com o JARVIS.');
          return;
        }

        setConfigured(data.configured !== false);

        let actionsExecuted: string[] = [];
        if (data.actions?.length) {
          actionsExecuted = await executeJarvisActions(data.actions, navigate);
          if (data.actions.some((a) => a.type === 'toggle_conta_pago')) {
            onRowsChanged?.();
          }
        }

        const assistantMsg: JarvisMessage = {
          id: newId(),
          role: 'assistant',
          content: data.message,
          actionsExecuted: actionsExecuted.length ? actionsExecuted : undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setError('Falha de rede ao contactar o JARVIS.');
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, navigate, onRowsChanged, rows, userId, userName],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    configured,
    sendMessage,
    reset,
  };
}
