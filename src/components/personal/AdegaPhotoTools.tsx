import { RefObject, ReactNode, useCallback, useRef, useState } from 'react';
import {
  importAdegaImageFromRemoteUrl,
  readClipboardImageFile,
  readClipboardImageUrl,
  searchAdegaImagesApi,
  type AdegaImageSearchHit,
} from '../../lib/adegaImageImport';
import { fileToDrinkImageUrl } from '../../lib/drinkCartaImage';
import { openGoogleImagesSearch } from '../../lib/googleSearch';
import styles from './ViniciusAdega.module.css';

interface AdegaPhotoToolsProps {
  imageQuery: string;
  googleQuery: string;
  imageUrl: string;
  userId: string | undefined;
  itemId: string | null;
  imageLoading: boolean;
  imageError: string | null;
  imageUrlInput: string;
  photoInputRef: RefObject<HTMLInputElement | null>;
  prefixButtons?: ReactNode;
  onImageUrlInputChange: (value: string) => void;
  onApplyImageUrl: () => void;
  onClearPhoto: () => void;
  onPhotoFile: (file: File | null) => void;
  onImageUrl: (url: string) => void;
}

export function AdegaPhotoTools({
  imageQuery,
  googleQuery,
  imageUrl,
  userId,
  itemId,
  imageLoading,
  imageError,
  imageUrlInput,
  photoInputRef,
  prefixButtons,
  onImageUrlInputChange,
  onApplyImageUrl,
  onClearPhoto,
  onPhotoFile,
  onImageUrl,
}: AdegaPhotoToolsProps) {
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [imageResults, setImageResults] = useState<AdegaImageSearchHit[]>([]);
  const [panelError, setPanelError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const busy = imageSearchLoading || imageLoading || Boolean(importingId);

  const runImageSearch = useCallback(async () => {
    const q = imageQuery.trim();
    if (q.length < 2) {
      setPanelError('Informe o nome antes de buscar fotos.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setImageSearchLoading(true);
    setPanelError(null);
    setImageResults([]);

    try {
      const data = await searchAdegaImagesApi(q, controller.signal);
      setImageResults(data.results);
      if (!data.results.length) {
        setPanelError('Nenhuma foto encontrada.');
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setPanelError(err instanceof Error ? err.message : 'Falha na busca de fotos.');
    } finally {
      if (!controller.signal.aborted) setImageSearchLoading(false);
    }
  }, [imageQuery]);

  const importImageHit = async (hit: AdegaImageSearchHit) => {
    if (!itemId) return;
    setImportingId(hit.id);
    setPanelError(null);
    try {
      const url = await importAdegaImageFromRemoteUrl(hit.imageUrl, userId ?? '', itemId);
      onImageUrl(url);
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Não foi possível usar esta foto.');
    } finally {
      setImportingId(null);
    }
  };

  const pasteFromClipboard = async () => {
    if (!itemId) return;
    setImportingId('clipboard');
    setPanelError(null);
    try {
      const file = await readClipboardImageFile();
      if (file) {
        onImageUrl(
          await fileToDrinkImageUrl(
            file,
            userId ? { userId, kind: 'adega', slug: itemId } : undefined,
          ),
        );
        return;
      }
      const clipUrl = await readClipboardImageUrl();
      if (clipUrl) {
        onImageUrl(await importAdegaImageFromRemoteUrl(clipUrl, userId ?? '', itemId));
        return;
      }
      setPanelError('Nada na área de transferência.');
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Não foi possível colar.');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className={styles.formAssistTools}>
      <div className={styles.formAssistBtnRow}>
        {prefixButtons}
        <button
            type="button"
            className={styles.formAssistBtn}
            disabled={busy || imageQuery.trim().length < 2}
            onClick={() => void runImageSearch()}
          >
            {imageSearchLoading ? '…' : 'Fotos'}
          </button>
          <button
            type="button"
            className={styles.formAssistBtn}
            disabled={busy}
            onClick={() => photoInputRef.current?.click()}
          >
            {imageLoading ? '…' : 'Arquivo'}
          </button>
          <button
            type="button"
            className={styles.formAssistBtn}
            disabled={busy}
            onClick={() => void pasteFromClipboard()}
          >
            Colar
          </button>
          <button
            type="button"
            className={styles.formAssistBtnGhost}
            disabled={googleQuery.trim().length < 2}
            onClick={() => openGoogleImagesSearch(googleQuery.trim())}
          >
            Google
          </button>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={styles.formPhotoInput}
          onChange={(e) => {
            void onPhotoFile(e.target.files?.[0] ?? null);
          }}
        />

        <details className={styles.formAssistDetails}>
          <summary>URL da foto</summary>
          <div className={styles.formPhotoUrlRow}>
            <input
              type="url"
              className={styles.input}
              value={imageUrlInput}
              onChange={(e) => onImageUrlInputChange(e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
            <button type="button" className={styles.formPhotoApplyBtn} onClick={onApplyImageUrl}>
              Usar
            </button>
          </div>
        </details>

        {imageUrl ? (
          <button type="button" className={styles.formPhotoClear} onClick={onClearPhoto}>
            Remover foto
          </button>
        ) : null}

      {imageResults.length > 0 ? (
        <ul className={styles.formAssistImageGrid}>
          {imageResults.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className={styles.imagePickerThumb}
                disabled={busy}
                onClick={() => void importImageHit(hit)}
                title={hit.title}
              >
                <img src={hit.thumbUrl} alt="" loading="lazy" decoding="async" />
                {importingId === hit.id ? (
                  <span className={styles.imagePickerThumbLoading}>…</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {panelError || imageError ? <p className={styles.formError}>{panelError ?? imageError}</p> : null}
    </div>
  );
}
