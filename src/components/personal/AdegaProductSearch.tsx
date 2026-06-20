import { useEffect, useId, useRef, useState } from 'react';
import { searchAdegaProducts, type AdegaSearchResult } from '../../lib/adegaSearch';
import styles from './ViniciusAdega.module.css';

const DEBOUNCE_MS = 520;
const MIN_QUERY = 3;

interface AdegaProductSearchProps {
  onSelect: (result: AdegaSearchResult) => void;
}

export function AdegaProductSearch({ onSelect }: AdegaProductSearchProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdegaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      setError(null);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      void searchAdegaProducts(q, controller.signal)
        .then((hits) => {
          setResults(hits);
          setOpen(true);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          const message = err instanceof Error ? err.message : 'Não foi possível buscar.';
          setError(message);
          setResults([]);
          setOpen(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const pick = (hit: AdegaSearchResult) => {
    onSelect(hit);
    setQuery('');
    setResults([]);
    setOpen(false);
    setError(null);
  };

  const showList =
    open && query.trim().length >= MIN_QUERY && (loading || results.length > 0 || Boolean(error));

  return (
    <div className={styles.catalogSearch} ref={rootRef}>
      <label className={styles.label} htmlFor="adega-catalog-search">
        Encontrar garrafa
      </label>
      <div className={styles.catalogSearchField}>
        <input
          id="adega-catalog-search"
          type="search"
          className={styles.catalogSearchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 && query.trim().length >= MIN_QUERY) setOpen(true);
          }}
          placeholder="Royal Salute, Johnnie Walker, vinho… (mín. 3 letras)"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={showList ? listId : undefined}
          aria-expanded={showList}
          enterKeyHint="search"
        />
        {loading ? <span className={styles.catalogSearchSpinner} aria-hidden /> : null}
      </div>
      <p className={styles.catalogSearchHint}>
        Catálogo Open Food Facts (global + Brasil) · toque num resultado para preencher o formulário.
      </p>

      {showList ? (
        <ul id={listId} className={styles.catalogResults} role="listbox">
          {loading && results.length === 0 ? (
            <li className={styles.catalogResultEmpty}>Buscando garrafas…</li>
          ) : null}
          {error ? <li className={styles.catalogResultEmpty}>{error}</li> : null}
          {!loading && !error && results.length === 0 ? (
            <li className={styles.catalogResultEmpty}>Nenhuma bebida encontrada. Tente outro nome ou cadastre manualmente.</li>
          ) : null}
          {results.map((hit) => (
            <li key={hit.barcode} role="option">
              <button type="button" className={styles.catalogResultBtn} onClick={() => pick(hit)}>
                <span className={styles.catalogResultMedia}>
                  {hit.imageUrl ? (
                    <img src={hit.imageUrl} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className={styles.catalogResultFallback} aria-hidden>
                      🍾
                    </span>
                  )}
                </span>
                <span className={styles.catalogResultBody}>
                  <span className={styles.catalogResultName}>{hit.name}</span>
                  <span className={styles.catalogResultMeta}>
                    {[hit.brand, hit.category, hit.volumeMl ? `${hit.volumeMl} ml` : null, hit.abv ? `${hit.abv}%` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
