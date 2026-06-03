import styles from './HubChat.module.css';

function iniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return (parts[0]?.charAt(0) ?? '?').toUpperCase();
}

export function HubChatAvatar({ nome, size = 44 }: { nome: string; size?: 40 | 44 }) {
  const px = size;
  return (
    <span
      className={styles.avatar}
      style={{ width: px, height: px, fontSize: px > 40 ? 15 : 14 }}
      aria-hidden
    >
      {iniciais(nome)}
    </span>
  );
}
