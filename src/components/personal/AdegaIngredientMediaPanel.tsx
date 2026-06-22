import { RefObject, useMemo } from 'react';
import {
  ADEGA_INGREDIENT_ICON_PRESETS,
  categoryEmoji,
  resolveIngredientCategory,
} from '../../lib/viniciusAdega';
import { adegaIngredientImageQuery } from '../../lib/googleSearch';
import { AdegaPhotoTools } from './AdegaPhotoTools';
import styles from './ViniciusAdega.module.css';

export type IngredientMediaMode = 'icon' | 'photo';

interface AdegaIngredientMediaPanelProps {
  name: string;
  mediaMode: IngredientMediaMode;
  iconEmoji: string;
  category: string;
  customCategory: string;
  imageUrl: string;
  userId: string | undefined;
  itemId: string | null;
  imageLoading: boolean;
  imageError: string | null;
  imageUrlInput: string;
  photoInputRef: RefObject<HTMLInputElement | null>;
  onMediaModeChange: (mode: IngredientMediaMode) => void;
  onIconEmojiChange: (emoji: string) => void;
  onImageUrlInputChange: (value: string) => void;
  onApplyImageUrl: () => void;
  onClearPhoto: () => void;
  onPhotoFile: (file: File | null) => void;
  onImageUrl: (url: string) => void;
}

export function AdegaIngredientMediaPanel({
  name,
  mediaMode,
  iconEmoji,
  category,
  customCategory,
  imageUrl,
  userId,
  itemId,
  imageLoading,
  imageError,
  imageUrlInput,
  photoInputRef,
  onMediaModeChange,
  onIconEmojiChange,
  onImageUrlInputChange,
  onApplyImageUrl,
  onClearPhoto,
  onPhotoFile,
  onImageUrl,
}: AdegaIngredientMediaPanelProps) {
  const resolvedCategory = resolveIngredientCategory(category, customCategory);
  const categoryIcon = categoryEmoji(resolvedCategory);

  const imageQuery = useMemo(
    () => adegaIngredientImageQuery({ name, category: resolvedCategory }),
    [name, resolvedCategory],
  );

  const googleQuery = useMemo(() => `${imageQuery.trim()} ingrediente`, [imageQuery]);

  const previewIcon = mediaMode === 'photo' && imageUrl ? null : iconEmoji || categoryIcon;

  return (
    <section className={styles.formAssist}>
      <div className={styles.ingredientMediaToggle} role="tablist" aria-label="Visual do ingrediente">
        <button
          type="button"
          role="tab"
          aria-selected={mediaMode === 'icon'}
          className={`${styles.ingredientMediaToggleBtn} ${
            mediaMode === 'icon' ? styles.ingredientMediaToggleBtnActive : ''
          }`}
          onClick={() => onMediaModeChange('icon')}
        >
          Ícone
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mediaMode === 'photo'}
          className={`${styles.ingredientMediaToggleBtn} ${
            mediaMode === 'photo' ? styles.ingredientMediaToggleBtnActive : ''
          }`}
          onClick={() => onMediaModeChange('photo')}
        >
          Foto
        </button>
      </div>

      <div className={styles.formAssistRow}>
        {mediaMode === 'photo' && imageUrl ? (
          <img src={imageUrl} alt="" className={styles.formAssistPreview} loading="lazy" decoding="async" />
        ) : (
          <span className={styles.formAssistPreviewFallback} aria-hidden>
            {previewIcon}
          </span>
        )}

        {mediaMode === 'photo' ? (
          <AdegaPhotoTools
            imageQuery={imageQuery}
            googleQuery={googleQuery}
            imageUrl={imageUrl}
            userId={userId}
            itemId={itemId}
            imageLoading={imageLoading}
            imageError={imageError}
            imageUrlInput={imageUrlInput}
            photoInputRef={photoInputRef}
            onImageUrlInputChange={onImageUrlInputChange}
            onApplyImageUrl={onApplyImageUrl}
            onClearPhoto={onClearPhoto}
            onPhotoFile={onPhotoFile}
            onImageUrl={onImageUrl}
          />
        ) : (
          <div className={styles.formAssistTools}>
            <div className={styles.formAssistBtnRow}>
              <button
                type="button"
                className={styles.formAssistBtnPrimary}
                onClick={() => onIconEmojiChange(categoryIcon)}
              >
                Ícone do tipo ({categoryIcon})
              </button>
            </div>
            <details className={styles.formAssistDetails} open>
              <summary>Escolher ícone</summary>
              <div className={styles.iconPickerGrid}>
                {ADEGA_INGREDIENT_ICON_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`${styles.iconPickerBtn} ${
                      iconEmoji === emoji ? styles.iconPickerBtnActive : ''
                    }`}
                    onClick={() => onIconEmojiChange(emoji)}
                    aria-label={`Usar ícone ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </section>
  );
}
