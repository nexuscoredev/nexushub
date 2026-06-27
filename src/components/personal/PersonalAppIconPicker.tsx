import { useCallback, useEffect, useRef, useState } from 'react';
import { readClipboardImageFile, readClipboardImageUrl } from '../../lib/adegaImageImport';
import {
  fileToAppIconImage,
  iconsEqual,
  imageIconSourceLabel,
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
  userId?: string;
  onClose: () => void;
  onSelect: (icon: PersonalAppIcon) => void;
  onReset: () => void;
}

export function PersonalAppIconPicker({
  open,
  app,
  defaultIcon,
  userId,
  onClose,
  onSelect,
  onReset,
}: PersonalAppIconPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emojiInput, setEmojiInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [letterInput, setLetterInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    if (!open || !app) return;
    setEmojiInput(app.icon.type === 'emoji' ? app.icon.value : '');
    if (app.icon.type === 'image') {
      if (app.icon.src.startsWith('data:')) {
        setImageUrl('');
        setLocalFileName(imageIconSourceLabel(app.icon.src));
      } else {
        setImageUrl(app.icon.src);
        setLocalFileName(null);
      }
    } else {
      setImageUrl('');
      setLocalFileName(null);
    }
    setLetterInput(app.icon.type === 'letter' ? app.icon.value : '');
    setError(null);
    setFileLoading(false);
  }, [open, app]);

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file || !app) return;
      setFileLoading(true);
      setError(null);
      try {
        const icon = await fileToAppIconImage(file, userId ? { userId, appId: app.id } : undefined);
        setLocalFileName(file.name);
        setImageUrl('');
        onSelect(icon);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível usar este arquivo.');
      } finally {
        setFileLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [app, onSelect, userId],
  );

  const pasteFromClipboard = useCallback(async () => {
    setFileLoading(true);
    setError(null);
    try {
      const file = await readClipboardImageFile();
      if (file) {
        await handleFileChange(file);
        return;
      }
      const clipUrl = await readClipboardImageUrl();
      if (clipUrl) {
        const icon = parseImageIconUrl(clipUrl);
        if (icon) {
          setImageUrl(clipUrl);
          setLocalFileName(null);
          onSelect(icon);
          return;
        }
      }
      setError('Nada na área de transferência (imagem ou URL de imagem).');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível colar.');
    } finally {
      setFileLoading(false);
    }
  }, [handleFileChange, onSelect]);

  useEffect(() => {
    if (!open || !app) return;

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (items?.length) {
        for (const item of items) {
          if (!item.type.startsWith('image/')) continue;
          const file = item.getAsFile();
          if (!file) continue;
          event.preventDefault();
          void handleFileChange(file);
          return;
        }
      }

      const text = event.clipboardData?.getData('text/plain')?.trim() ?? '';
      if (!text) return;
      const icon = parseImageIconUrl(text);
      if (!icon) return;
      event.preventDefault();
      setImageUrl(text);
      setLocalFileName(null);
      onSelect(icon);
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [app, handleFileChange, onSelect, open]);

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
          <p className={styles.sectionLabel}>Do computador</p>
          <p className={styles.hint}>
            Arquivo, colar imagem (Ctrl+V) ou URL — .ico, .png, .jpg, .webp ou .svg, até 2 MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className={styles.fileInput}
            accept=".ico,.icon,.png,.jpg,.jpeg,.webp,.gif,.svg,image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={(e) => {
              void handleFileChange(e.target.files?.[0] ?? null);
            }}
          />
          <div className={styles.fileBtnRow}>
            <button
              type="button"
              className={styles.fileBtn}
              disabled={fileLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {fileLoading ? 'Processando…' : 'Escolher arquivo'}
            </button>
            <button
              type="button"
              className={styles.fileBtn}
              disabled={fileLoading}
              onClick={() => void pasteFromClipboard()}
            >
              {fileLoading ? 'Processando…' : 'Colar imagem'}
            </button>
          </div>
          {localFileName ? <p className={styles.fileName}>{localFileName}</p> : null}
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Imagem (URL)</p>
          <div className={styles.inlineField}>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setLocalFileName(null);
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
