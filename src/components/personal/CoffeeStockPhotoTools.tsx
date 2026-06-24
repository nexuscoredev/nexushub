import { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import {
  coffeeCapsuleCatalogLabel,
  coffeeCapsuleCatalogUrl,
  coffeeCapsuleGoogleImagesQuery,
  coffeeCapsuleImageApiQuery,
  openCoffeeCapsuleCatalog,
} from '../../lib/coffeeCapsuleImageSearch';
import {
  importAdegaImageFromRemoteUrl,
  readClipboardImageFile,
  readClipboardImageUrl,
  searchAdegaImagesApi,
  type AdegaImageSearchHit,
} from '../../lib/adegaImageImport';
import { fileToDrinkImageUrl, parseDrinkImageUrl } from '../../lib/drinkCartaImage';
import { openGoogleImagesSearch } from '../../lib/googleSearch';
import type { CoffeeCapsuleSystem } from '../../lib/viniciusCoffeeStock';
import adegaStyles from './ViniciusAdega.module.css';
import styles from './ViniciusCoffee.module.css';

type CoffeeStockPhotoToolsProps = {
  name: string;
  brand: string;
  category: string;
  customCategory: string;
  imageUrl: string;
  imageUrlInput: string;
  userId: string | undefined;
  itemId: string;
  photoInputRef: RefObject<HTMLInputElement | null>;
  onImageUrlInputChange: (value: string) => void;
  onImageUrl: (url: string) => void;
  onClearPhoto: () => void;
};

export function CoffeeStockPhotoTools({
  name,
  brand,
  category,
  customCategory,
  imageUrl,
  imageUrlInput,
  userId,
  itemId,
  photoInputRef,
  onImageUrlInputChange,
  onImageUrl,
  onClearPhoto,
}: CoffeeStockPhotoToolsProps) {
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResults, setImageResults] = useState<AdegaImageSearchHit[]>([]);
  const [panelError, setPanelError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const resolvedCategory = category === 'Outro' ? customCategory.trim() : category;
  const capsuleSystem = useMemo(
    () => coffeeCapsuleImageApiQuery({ name, brand, category: resolvedCategory }).capsuleSystem,
    [name, brand, resolvedCategory],
  );

  const imageQuery = useMemo(
    () => coffeeCapsuleImageApiQuery({ name, brand, category: resolvedCategory }).query,
    [name, brand, resolvedCategory],
  );

  const googleQuery = useMemo(
    () => coffeeCapsuleGoogleImagesQuery({ name, brand, category: resolvedCategory }),
    [name, brand, resolvedCategory],
  );

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
      const data = await searchAdegaImagesApi(q, controller.signal, {
        capsuleSystem: capsuleSystem as CoffeeCapsuleSystem | undefined,
      });
      setImageResults(data.results);
      if (!data.results.length) {
        setPanelError(
          capsuleSystem
            ? 'Nenhuma foto no catálogo oficial. Tente o catálogo ou o Google.'
            : 'Nenhuma foto encontrada.',
        );
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setPanelError(err instanceof Error ? err.message : 'Falha na busca de fotos.');
    } finally {
      if (!controller.signal.aborted) setImageSearchLoading(false);
    }
  }, [imageQuery, capsuleSystem]);

  const importImageHit = async (hit: AdegaImageSearchHit) => {
    if (!userId) return;
    setImportingId(hit.id);
    setPanelError(null);
    try {
      onImageUrl(await importAdegaImageFromRemoteUrl(hit.imageUrl, userId, itemId, 'coffee'));
      setImageResults([]);
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Não foi possível importar.');
    } finally {
      setImportingId(null);
    }
  };

  const onPhotoFile = async (file: File | null) => {
    if (!file) return;
    setImageLoading(true);
    setPanelError(null);
    try {
      onImageUrl(
        await fileToDrinkImageUrl(
          file,
          userId ? { userId, kind: 'coffee', slug: itemId } : undefined,
        ),
      );
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Falha ao enviar foto.');
    } finally {
      setImageLoading(false);
    }
  };

  const applyImageUrl = async () => {
    const parsed = parseDrinkImageUrl(imageUrlInput);
    if (!parsed) {
      setPanelError('URL inválida.');
      return;
    }
    if (!userId || parsed.startsWith('data:')) {
      onImageUrl(parsed);
      return;
    }
    setImageLoading(true);
    setPanelError(null);
    try {
      onImageUrl(await importAdegaImageFromRemoteUrl(parsed, userId, itemId, 'coffee'));
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Não foi possível usar a URL.');
    } finally {
      setImageLoading(false);
    }
  };

  const pasteFromClipboard = async () => {
    setImportingId('clipboard');
    setPanelError(null);
    try {
      const file = await readClipboardImageFile();
      if (file) {
        await onPhotoFile(file);
        return;
      }
      const clipUrl = await readClipboardImageUrl();
      if (clipUrl && userId) {
        onImageUrl(await importAdegaImageFromRemoteUrl(clipUrl, userId, itemId, 'coffee'));
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
    <div className={styles.stockPhotoSection}>
      <span className={styles.stockPhotoLabel}>Foto da cápsula</span>

      {imageUrl ? (
        <div className={styles.stockPhotoPreview}>
          <img src={imageUrl} alt="" />
        </div>
      ) : null}

      {capsuleSystem ? (
        <p className={styles.stockPhotoHint}>
          Busca prioriza{' '}
          <a href={coffeeCapsuleCatalogUrl(capsuleSystem)} target="_blank" rel="noopener noreferrer">
            {coffeeCapsuleCatalogLabel(capsuleSystem)}
          </a>
          .
        </p>
      ) : null}

      <div className={adegaStyles.formAssistTools}>
        <div className={adegaStyles.formAssistBtnRow}>
          <button
            type="button"
            className={adegaStyles.formAssistBtn}
            disabled={busy || imageQuery.trim().length < 2}
            onClick={() => void runImageSearch()}
          >
            {imageSearchLoading ? '…' : 'Fotos'}
          </button>
          <button
            type="button"
            className={adegaStyles.formAssistBtn}
            disabled={busy}
            onClick={() => photoInputRef.current?.click()}
          >
            {imageLoading ? '…' : 'Arquivo'}
          </button>
          <button
            type="button"
            className={adegaStyles.formAssistBtn}
            disabled={busy}
            onClick={() => void pasteFromClipboard()}
          >
            Colar
          </button>
          {capsuleSystem ? (
            <button
              type="button"
              className={adegaStyles.formAssistBtnGhost}
              onClick={() => openCoffeeCapsuleCatalog(capsuleSystem)}
            >
              Catálogo
            </button>
          ) : null}
          <button
            type="button"
            className={adegaStyles.formAssistBtnGhost}
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
          className={adegaStyles.formPhotoInput}
          onChange={(e) => {
            void onPhotoFile(e.target.files?.[0] ?? null);
          }}
        />

        <details className={adegaStyles.formAssistDetails}>
          <summary>URL da foto</summary>
          <div className={adegaStyles.formPhotoUrlRow}>
            <input
              type="url"
              className={adegaStyles.input}
              value={imageUrlInput}
              onChange={(e) => onImageUrlInputChange(e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
            <button type="button" className={adegaStyles.formPhotoApplyBtn} onClick={() => void applyImageUrl()}>
              Usar
            </button>
          </div>
        </details>

        {imageUrl ? (
          <button type="button" className={adegaStyles.formPhotoClear} onClick={onClearPhoto}>
            Remover foto
          </button>
        ) : null}

        {imageResults.length > 0 ? (
          <ul className={adegaStyles.formAssistImageGrid}>
            {imageResults.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className={adegaStyles.imagePickerThumb}
                  disabled={busy}
                  onClick={() => void importImageHit(hit)}
                  title={hit.title}
                >
                  <img src={hit.thumbUrl} alt="" loading="lazy" decoding="async" />
                  {importingId === hit.id ? (
                    <span className={adegaStyles.imagePickerThumbLoading}>…</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {panelError ? <p className={adegaStyles.formError}>{panelError}</p> : null}
      </div>
    </div>
  );
}
