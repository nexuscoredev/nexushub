interface TodoistIconProps {
  className?: string;
}

const TODOIST_ICON_SRC = '/img/apps/todoist.png';

/** Marca Todoist oficial (vermelho + três checks). */
export function TodoistIcon({ className }: TodoistIconProps) {
  return (
    <img
      src={TODOIST_ICON_SRC}
      alt=""
      className={className}
      width={24}
      height={24}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
