import styles from './UserAvatar.module.css';

function userInitial(name: string | undefined, email: string | undefined): string {
  const n = (name ?? email ?? '?').trim();
  return n.charAt(0).toUpperCase();
}

interface UserAvatarProps {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 'sm',
  className = '',
}: UserAvatarProps) {
  const sizeClass = styles[size];
  const initial = userInitial(name, email);

  return (
    <span className={`${styles.avatar} ${sizeClass} ${className}`.trim()} aria-hidden>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className={styles.img} />
      ) : (
        initial
      )}
    </span>
  );
}
