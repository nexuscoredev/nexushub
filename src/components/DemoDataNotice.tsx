import styles from './DemoDataNotice.module.css';

interface DemoDataNoticeProps {
  className?: string;
  compact?: boolean;
  dark?: boolean;
}

export function DemoDataNotice({ className, compact, dark }: DemoDataNoticeProps) {
  return (
    <p
      className={`${styles.notice} ${compact ? styles.noticeCompact : ''} ${dark ? styles.noticeDark : ''} ${className ?? ''}`.trim()}
    >
      Dados fictícios — valores ilustrativos gerados para esta demonstração.
    </p>
  );
}
