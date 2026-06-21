import { useCallback, useEffect, useRef, useState } from 'react';
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

interface AdegaImagePickerProps {
  query: string;
  userId: string | undefined;
  itemId: string | null;
  onImageUrl: (url: string) => void;
}

export function AdegaImagePicker({ query, userId, itemId, onImageUrl }: AdegaImagePickerProps) {
  const [results, setResults] = useState<AdegaImageSearchHit[]>([]);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) {
      setError('Preencha o nome antes de buscar fotos.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await searchAdegaImagesApi(q, controller.signal);
      setResults(data.results);
      setGoogleConfigured(data.googleConfigured);
      if (!data.results.length) {
        setError('Nenhuma foto encontrada. Tente o Google Imagens ou cole uma imagem copiada.');
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Falha na busca de fotos.');
      setResults([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [query]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const importHit = async (hit: AdegaImageSearchHit) => {
    if (!itemId) return;
    setImportingId(hit.id);
    setError(null);
    try {
      const url = await importAdegaImageFromRemoteUrl(hit.imageUrl, userId ?? '', itemId);
      onImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível usar esta foto.');
    } finally {
      setImportingId(null);
    }
  };

  const pasteFromClipboard = async () => {
    if (!itemId) return;
    setError(null);
    setImportingId('clipboard');
    try {
      const file = await readClipboardImageFile();
      if (file) {
        const url = await fileToDrinkImageUrl(
          file,
          userId ? { userId, kind: 'adega', slug: itemId } : undefined,
        );
        onImageUrl(url);
        return;
      }

      const clipUrl = await readClipboardImageUrl();
      if (clipUrl) {
        const url = await importAdegaImageFromRemoteUrl(clipUrl, userId ?? '', itemId);
        onImageUrl(url);
        return;
      }

      setError('Nada na área de transferência. Copie uma imagem ou link de foto no Google.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível colar a imagem.');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <section className={styles.imagePicker}>
      <div className={styles.imagePickerHead}>
        <p className={styles.imagePickerTitle}>Buscar foto da garrafa</p>
        <p className={styles.imagePickerHint}>
          Toque numa miniatura para usar, ou copie no Google e cole aqui.
        </p>
      </div>

      <div className={styles.imagePickerActions}>
        <button
          type="button"
          className={styles.imagePickerBtn}
          disabled={loading || query.trim().length < 2}
          onClick={() => void runSearch()}
        >
          {loading ? 'Buscando…' : 'Buscar fotos aqui'}
        </button>
        <button
          type="button"
          className={styles.imagePickerBtnSecondary}
          disabled={query.trim().length < 2}
          onClick={() => openGoogleImagesSearch(`${query.trim()} garrafa`)}
        >
          Google Imagens
        </button>
        <button
          type="button"
          className={styles.imagePickerBtnSecondary}
          disabled={Boolean(importingId)}
          onClick={() => void pasteFromClipboard()}
        >
          {importingId === 'clipboard' ? 'Colando…' : 'Colar copiada'}
        </button>
      </div>

      {searched && results.length > 0 ? (
        <ul className={styles.imagePickerGrid}>
          {results.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className={styles.imagePickerThumb}
                disabled={Boolean(importingId)}
                onClick={() => void importHit(hit)}
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

      {searched && !loading ? (
        <p className={styles.imagePickerAttribution}>
          {googleConfigured
            ? 'Fontes: Google Imagens + Wikimedia Commons'
            : 'Fonte: Wikimedia Commons · para mais resultados, use Google Imagens + Colar copiada'}
        </p>
      ) : null}

      {error ? <p className={styles.formError}>{error}</p> : null}
    </section>
  );
}
