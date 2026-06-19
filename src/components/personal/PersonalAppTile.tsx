import type { PersonalInternalAction, ResolvedPersonalApp } from '../../lib/personalApps';
import { PersonalAppIcon } from './PersonalAppIcon';
import styles from './PersonalAppGrid.module.css';

interface PersonalAppTileProps {
  app: ResolvedPersonalApp;
  editing: boolean;
  dragging: boolean;
  dragOver: boolean;
  onInternal?: (action: PersonalInternalAction) => void;
  onRemove?: () => void;
  onEditIcon?: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function iconWrapClass(app: ResolvedPersonalApp): string {
  const base = styles.iconWrap;
  const { icon } = app;
  if (icon.type === 'piggy') return `${base} ${styles.iconWrapFinance}`;
  if (icon.type === 'the-news') return `${base} ${styles.iconWrapTheNews}`;
  if (icon.type === 'drinks-carta' || (icon.type === 'image' && app.id === 'drinks')) {
    return `${base} ${styles.iconWrapDrinks}`;
  }
  if (icon.type === 'adega' || (icon.type === 'image' && app.id === 'adega')) {
    return `${base} ${styles.iconWrapAdega}`;
  }
  if (icon.type === 'pc-guide') return `${base} ${styles.iconWrapPcGuide}`;
  if (icon.type === 'letter') return `${base} ${styles.iconWrapLetter}`;
  if (icon.type === 'material' && icon.tone === 'green') return `${base} ${styles.iconWrapGreen}`;
  if (icon.type === 'material' && icon.tone === 'violet') return `${base} ${styles.iconWrapPcGuide}`;
  return base;
}

export function PersonalAppTile({
  app,
  editing,
  dragging,
  dragOver,
  onInternal,
  onRemove,
  onEditIcon,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: PersonalAppTileProps) {
  const tileClass = [
    styles.tile,
    editing ? styles.tileEditing : '',
    dragging ? styles.tileDragging : '',
    dragOver ? styles.tileDragOver : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      {editing && onRemove ? (
        <button
          type="button"
          className={styles.removeBtn}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remover ${app.label} da home`}
        >
          −
        </button>
      ) : null}
      <span className={iconWrapClass(app)}>
        {editing && onEditIcon ? (
          <button
            type="button"
            className={styles.editIconBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEditIcon();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Alterar ícone de ${app.label}`}
          >
            <PersonalAppIcon icon={app.icon} label={app.label} />
            <span className={styles.editIconBadge} aria-hidden>
              ✎
            </span>
          </button>
        ) : (
          <PersonalAppIcon icon={app.icon} label={app.label} />
        )}
      </span>
      <span className={styles.label}>{app.label}</span>
    </>
  );

  if (editing) {
    return (
      <div
        className={tileClass}
        role="listitem"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        aria-label={app.subtitle ? `${app.label} — ${app.subtitle}` : app.label}
        aria-grabbed={dragging}
      >
        {body}
      </div>
    );
  }

  if (app.kind === 'internal' && app.internalAction) {
    return (
      <button
        type="button"
        className={tileClass}
        role="listitem"
        onClick={() => onInternal?.(app.internalAction!)}
        aria-label={app.subtitle ? `${app.label} — ${app.subtitle}` : app.label}
      >
        {body}
      </button>
    );
  }

  return (
    <a
      href={app.href}
      target="_blank"
      rel="noopener noreferrer"
      className={tileClass}
      role="listitem"
      aria-label={app.subtitle ? `${app.label} — ${app.subtitle}` : app.label}
      title={app.subtitle}
    >
      {body}
    </a>
  );
}
