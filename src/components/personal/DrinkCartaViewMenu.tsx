import { useEffect, useRef, useState } from 'react';
import {
  DRINK_CARTA_VIEW_OPTIONS,
  getDrinkCartaViewOption,
  type DrinkCartaViewMode,
} from '../../lib/drinkCartaView';
import styles from './ViniciusDrinksCarta.module.css';

type DrinkCartaViewMenuProps = {
  viewMode: DrinkCartaViewMode;
  onViewModeChange: (mode: DrinkCartaViewMode) => void;
};

function ViewModeIcon({ mode }: { mode: DrinkCartaViewMode }) {
  const className = styles.viewMenuIcon;

  switch (mode) {
    case 'icons-xl':
      return (
        <span className={className} aria-hidden>
          <span className={`${styles.viewMenuGlyph} ${styles.viewMenuGlyphXl}`} />
        </span>
      );
    case 'icons-lg':
      return (
        <span className={className} aria-hidden>
          <span className={`${styles.viewMenuGlyph} ${styles.viewMenuGlyphLg}`} />
        </span>
      );
    case 'icons-md':
      return (
        <span className={className} aria-hidden>
          <span className={`${styles.viewMenuGlyph} ${styles.viewMenuGlyphMd}`} />
        </span>
      );
    case 'icons-sm':
      return (
        <span className={className} aria-hidden>
          <span className={styles.viewMenuGlyphGrid}>
            <span />
            <span />
            <span />
            <span />
          </span>
        </span>
      );
    case 'list':
      return (
        <span className={className} aria-hidden>
          <span className={styles.viewMenuGlyphList}>
            <span />
            <span />
            <span />
          </span>
        </span>
      );
    case 'details':
      return (
        <span className={className} aria-hidden>
          <span className={styles.viewMenuGlyphDetails}>
            <span />
            <span />
            <span />
          </span>
        </span>
      );
    case 'tiles':
      return (
        <span className={className} aria-hidden>
          <span className={styles.viewMenuGlyphTiles}>
            <span />
            <span />
          </span>
        </span>
      );
    case 'content':
    default:
      return (
        <span className={className} aria-hidden>
          <span className={styles.viewMenuGlyphContent}>
            <span />
            <span />
            <span />
          </span>
        </span>
      );
  }
}

export function DrinkCartaViewMenu({ viewMode, onViewModeChange }: DrinkCartaViewMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = getDrinkCartaViewOption(viewMode);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.viewMenuRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.discoverIconBtn}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Visualização: ${active.label}`}
        title={`Visualização: ${active.label}`}
      >
        <ViewModeIcon mode={viewMode} />
        <span className={styles.viewMenuBtnLabel}>Exibir</span>
      </button>

      {open ? (
        <div className={styles.viewMenuPanel} role="menu" aria-label="Opções de visualização">
          {DRINK_CARTA_VIEW_OPTIONS.map((option) => {
            const selected = option.id === viewMode;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`${styles.viewMenuItem} ${selected ? styles.viewMenuItemActive : ''}`}
                onClick={() => {
                  onViewModeChange(option.id);
                  setOpen(false);
                }}
              >
                <span className={styles.viewMenuItemMark} aria-hidden>
                  {selected ? '●' : ''}
                </span>
                <ViewModeIcon mode={option.id} />
                <span className={styles.viewMenuItemLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
