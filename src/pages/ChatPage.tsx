import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChatFloat } from '../contexts/ChatFloatContext';

/** `/chat` abre o widget e redireciona; `?u=` abre DM com o utilizador. */
export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openChat, openChatWithUser } = useChatFloat();
  const feito = useRef(false);

  useEffect(() => {
    if (feito.current) return;
    feito.current = true;
    const u = searchParams.get('u');
    if (u?.trim()) openChatWithUser(u.trim());
    else openChat();
    navigate('/dashboard', { replace: true });
  }, [navigate, openChat, openChatWithUser, searchParams]);

  return null;
}
