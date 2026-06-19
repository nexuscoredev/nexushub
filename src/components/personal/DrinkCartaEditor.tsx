import { useEffect, useRef, useState } from 'react';
import type { ViniciusDrink } from '../../lib/viniciusDrinksCarta';
import {
  drinkImageSourceLabel,
  fileToDrinkImageUrl,
  parseDrinkImageUrl,
} from '../../lib/drinkCartaImage';
import {
  defaultDrinkImageUrl,
  linesToList,
  listToLines,
  type DrinkCartaOverride,
} from '../../lib/viniciusDrinksCartaStore';
import styles from './ViniciusDrinksCarta.module.css';

interface DrinkCartaEditorProps {
  open: boolean;
  drink: ViniciusDrink | null;
  onClose: () => void;
  onSave: (slug: string, patch: DrinkCartaOverride) => void;
  onResetField: (slug: string, field: keyof DrinkCartaOverride) => void;
}

export function DrinkCartaEditor({
  open,
  drink,
  onClose,
  onSave,
  onResetField,
}: DrinkCartaEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    if (!open || !drink) return;
    setTitle(drink.title);
    setTagline(drink.tagline);
    setIngredientsText(listToLines(drink.ingredients));
    setStepsText(listToLines(drink.steps));
    setNotes(drink.notes ?? '');
    setImagePreview(drink.imageUrl);
    if (drink.imageUrl.startsWith('data:')) {
      setImageUrl('');
      setLocalFileName(drinkImageSourceLabel(drink.imageUrl));
    } else if (drink.imageUrl !== defaultDrinkImageUrl(drink.slug)) {
      setImageUrl(drink.imageUrl);
      setLocalFileName(null);
    } else {
      setImageUrl('');
      setLocalFileName(null);
    }
    setError(null);
    setFileLoading(false);
  }, [open, drink]);

  if (!open || !drink) return null;

  const defaultImage = defaultDrinkImageUrl(drink.slug);
  const hasCustomImage = drink.imageUrl !== defaultImage;

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setFileLoading(true);
    setError(null);
    try {
      const url = await fileToDrinkImageUrl(file);
      setImagePreview(url);
      setLocalFileName(file.name);
      setImageUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível usar este arquivo.');
    } finally {
      setFileLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const applyImageUrl = () => {
    const parsed = parseDrinkImageUrl(imageUrl);
    if (!parsed) {
      setError('URL de imagem inválida.');
      return;
    }
    setImagePreview(parsed);
    setLocalFileName(null);
    setError(null);
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Informe o nome do drink.');
      return;
    }

    const patch: DrinkCartaOverride = {
      title: trimmedTitle,
      tagline: tagline.trim(),
      ingredients: linesToList(ingredientsText),
      steps: linesToList(stepsText),
      notes: notes.trim(),
    };

    if (imagePreview && imagePreview !== defaultImage) {
      patch.imageUrl = imagePreview;
    }

    onSave(drink.slug, patch);
    onClose();
  };

  return (
    <div className={styles.editorBackdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.editorSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drink-editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.editorHeader}>
          <div>
            <h3 id="drink-editor-title" className={styles.editorTitle}>
              Editar {drink.title}
            </h3>
            <p className={styles.editorSub}>Alterações ficam salvas só neste navegador.</p>
          </div>
          <button type="button" className={styles.editorClose} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className={styles.editorBody}>
          <section className={styles.editorSection}>
            <h4 className={styles.editorLabel}>Foto do drink</h4>
            <div className={styles.editorPhotoRow}>
              <img src={imagePreview} alt="" className={styles.editorPhotoPreview} />
              <div className={styles.editorPhotoActions}>
                <button
                  type="button"
                  className={styles.editorBtn}
                  disabled={fileLoading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {fileLoading ? 'Processando…' : 'Enviar foto'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className={styles.editorFileInput}
                  onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
                />
                {localFileName ? (
                  <p className={styles.editorFileHint}>{localFileName}</p>
                ) : null}
                <div className={styles.editorUrlRow}>
                  <input
                    type="url"
                    className={styles.editorInput}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Ou cole uma URL de imagem"
                  />
                  <button type="button" className={styles.editorBtnSecondary} onClick={applyImageUrl}>
                    Usar URL
                  </button>
                </div>
                {hasCustomImage ? (
                  <button
                    type="button"
                    className={styles.editorResetLink}
                    onClick={() => {
                      onResetField(drink.slug, 'imageUrl');
                      setImagePreview(defaultImage);
                      setImageUrl('');
                      setLocalFileName(null);
                    }}
                  >
                    Restaurar foto original
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section className={styles.editorSection}>
            <label className={styles.editorLabel} htmlFor="drink-edit-title">
              Nome
            </label>
            <input
              id="drink-edit-title"
              className={styles.editorInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </section>

          <section className={styles.editorSection}>
            <label className={styles.editorLabel} htmlFor="drink-edit-tagline">
              Descrição curta
            </label>
            <textarea
              id="drink-edit-tagline"
              className={styles.editorTextarea}
              rows={2}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </section>

          <section className={styles.editorSection}>
            <label className={styles.editorLabel} htmlFor="drink-edit-ingredients">
              Ingredientes
            </label>
            <textarea
              id="drink-edit-ingredients"
              className={styles.editorTextarea}
              rows={5}
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="Um ingrediente por linha"
            />
          </section>

          <section className={styles.editorSection}>
            <label className={styles.editorLabel} htmlFor="drink-edit-steps">
              Passos
            </label>
            <textarea
              id="drink-edit-steps"
              className={styles.editorTextarea}
              rows={5}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder="Um passo por linha"
            />
          </section>

          <section className={styles.editorSection}>
            <label className={styles.editorLabel} htmlFor="drink-edit-notes">
              Observações
            </label>
            <textarea
              id="drink-edit-notes"
              className={styles.editorTextarea}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          {error ? <p className={styles.editorError}>{error}</p> : null}
        </div>

        <footer className={styles.editorFooter}>
          <button type="button" className={styles.editorBtnSecondary} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={styles.editorBtnPrimary} onClick={handleSave}>
            Salvar
          </button>
        </footer>
      </div>
    </div>
  );
}
