import { useEffect, useState } from 'react';
import {
  iconsEqual,
  parseEmojiIcon,
  parseImageIconUrl,
  parseLetterIcon,
  PERSONAL_APP_EMOJI_OPTIONS,
  PERSONAL_APP_MATERIAL_OPTIONS,
} from '../../lib/personalAppIconOptions';
import type { PersonalAppIcon, ResolvedPersonalApp } from '../../lib/personalApps';
import { PersonalAppIcon as PersonalAppIconView } from './PersonalAppIcon';
import styles from './PersonalAppIconPicker.module.css';

interface PersonalAppIconPickerProps {
  open: boolean;
  app: ResolvedPersonalApp | null;
  defaultIcon: PersonalAppIcon | null;
  onClose: () => void;
  onSelect: (icon: PersonalAppIcon) => void;
  onReset: () => void;
}

export function PersonalAppIconPicker({
  open,
  app,
  defaultIcon,
  onClose,
  onSelect,
  onReset,
}: PersonalAppIconPickerProps) {
  const [emojiInput, setEmojiInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [letterInput, setLetterInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !app) return;
    setEmojiInput(app.icon.type === 'emoji' ? app.icon.value : '');
    setImageUrl(app.icon.type === 'image' ? app.icon.src : '');
    setLetterInput(app.icon.type === 'letter' ? app.icon.value : '');
    setError(null);
  }, [open, app]);

  if (!open || !app) return null;

  const hasCustomIcon = defaultIcon != null && !iconsEqual(app.icon, defaultIcon);

  const applyEmoji = (value: string) => {
    const icon = parseEmojiIcon(value);
    if (!icon) {
      setError('Use um único emoji.');
      return;
    }
    onSelect(icon);
  };

  const applyImage = () => {
    const icon = parseImageIconUrl(imageUrl);
    if (!icon) {
      setError('URL de imagem inválida.');
      return;
    }
    onSelect(icon);
  };

  const applyLetter = () => {
    onSelect(parseLetterIcon(letterInput, app.label));
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="icon-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h4 id="icon-picker-title" className={styles.title}>
              Ícone de {app.label}
            </h4>
            <p className={styles.sub}>Escolha como o app aparece na home.</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className={styles.preview}>
          <span className={styles.previewWrap}>
            <PersonalAppIconView icon={app.icon} label={app.label} />
          </span>
        </div>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Emoji</p>
          <div className={styles.emojiGrid}>
            {PERSONAL_APP_EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`${styles.emojiBtn} ${app.icon.type === 'emoji' && app.icon.value === emoji ? styles.optionActive : ''}`}
                onClick={() => onSelect({ type: 'emoji', value: emoji })}
                aria-label={`Emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className={styles.inlineField}>
            <input
              type="text"
              value={emojiInput}
              onChange={(e) => {
                setEmojiInput(e.target.value);
                setError(null);
              }}
              placeholder="Outro emoji"
              maxLength={4}
            />
            <button type="button" className={styles.applyBtn} onClick={() => applyEmoji(emojiInput)}>
              Usar
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Símbolos</p>
          <div className={styles.symbolGrid}>
            {PERSONAL_APP_MATERIAL_OPTIONS.map((option) => {
              const icon: PersonalAppIcon = {
                type: 'material',
                name: option.name,
                tone: option.tone,
              };
              const active =
                app.icon.type === 'material' &&
                app.icon.name === option.name &&
                (app.icon.tone ?? 'cyan') === (option.tone ?? 'cyan');
              return (
                <button
                  key={`${option.name}-${option.tone ?? 'cyan'}`}
                  type="button"
                  className={`${styles.symbolBtn} ${active ? styles.optionActive : ''}`}
                  onClick={() => onSelect(icon)}
                  aria-label={option.name}
                >
                  <span
                    className={`material-symbols-outlined ${styles.symbolIcon} ${styles[`tone${option.tone ?? 'cyan'}`]}`}
                    aria-hidden
                  >
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Letra</p>
          <div className={styles.inlineField}>
            <input
              type="text"
              value={letterInput}
              onChange={(e) => {
                setLetterInput(e.target.value);
                setError(null);
              }}
              placeholder={app.label.charAt(0).toUpperCase()}
              maxLength={2}
            />
            <button type="button" className={styles.applyBtn} onClick={applyLetter}>
              Usar
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Imagem (URL)</p>
          <div className={styles.inlineField}>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://…"
              inputMode="url"
            />
            <button type="button" className={styles.applyBtn} onClick={applyImage}>
              Usar
            </button>
          </div>
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}

        {hasCustomIcon ? (
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            Restaurar ícone padrão
          </button>
        ) : null}
      </div>
    </div>
  );
}
