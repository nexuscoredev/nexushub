import { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { importAdegaImageFromRemoteUrl } from '../../lib/adegaImageImport';
import {
  adegaProductSearchQuery,
  mapAdegaSearchResultToForm,
  searchAdegaProducts,
  type AdegaSearchFormPatch,
  type AdegaSearchResult,
} from '../../lib/adegaSearch';
import { adegaItemGoogleQuery } from '../../lib/googleSearch';
import { formatVolume } from '../../lib/viniciusAdega';
import { AdegaPhotoTools } from './AdegaPhotoTools';
import styles from './ViniciusAdega.module.css';

interface AdegaBeverageMediaPanelProps {
  name: string;
  brand: string;
  category: string;
  customCategory: string;
  imageUrl: string;
  userId: string | undefined;
  itemId: string | null;
  imageLoading: boolean;
  imageError: string | null;
  imageUrlInput: string;
  photoInputRef: RefObject<HTMLInputElement | null>;
  onImageUrlInputChange: (value: string) => void;
  onApplyImageUrl: () => void;
  onClearPhoto: () => void;
  onPhotoFile: (file: File | null) => void;
  onApplyProduct: (patch: AdegaSearchFormPatch) => void;
  onImageUrl: (url: string) => void;
}

function productMeta(result: AdegaSearchResult): string {
  return [
    result.brand,
    result.category !== 'Outro' ? result.category : null,
    formatVolume(result.volumeMl),
    result.abv != null ? `${result.abv}%` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function AdegaBeverageMediaPanel({
  name,
  brand,
  category,
  customCategory,
  imageUrl,
  userId,
  itemId,
  imageLoading,
  imageError,
  imageUrlInput,
  photoInputRef,
  onImageUrlInputChange,
  onApplyImageUrl,
  onClearPhoto,
  onPhotoFile,
  onApplyProduct,
  onImageUrl,
}: AdegaBeverageMediaPanelProps) {
  const [productLoading, setProductLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [productResults, setProductResults] = useState<AdegaSearchResult[]>([]);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [appliedBarcode, setAppliedBarcode] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedProduct = useMemo(
    () => productResults.find((result) => result.barcode === selectedBarcode) ?? null,
    [productResults, selectedBarcode],
  );

  const productQuery = useMemo(() => adegaProductSearchQuery({ name, brand }), [name, brand]);
  const imageQuery = useMemo(
    () =>
      adegaItemGoogleQuery({
        name,
        brand,
        category: category === 'Outro' ? customCategory : category,
      }),
    [name, brand, category, customCategory],
  );
  const googleQuery = useMemo(() => `${imageQuery.trim()} garrafa`, [imageQuery]);

  const applyProduct = useCallback(
    async (result: AdegaSearchResult) => {
      setImportingId(`p-${result.barcode}`);
      setPanelError(null);
      try {
        const patch = mapAdegaSearchResultToForm(result);
        if (result.imageUrl && itemId) {
          try {
            patch.imageUrl = await importAdegaImageFromRemoteUrl(
              result.imageUrl,
              userId ?? '',
              itemId,
            );
          } catch {
            patch.imageUrl = result.imageUrl;
          }
        }
        onApplyProduct(patch);
        setAppliedBarcode(result.barcode);
      } catch (err) {
        setPanelError(err instanceof Error ? err.message : 'Não foi possível aplicar o produto.');
      } finally {
        setImportingId(null);
      }
    },
    [itemId, onApplyProduct, userId],
  );

  const runProductSearch = useCallback(async () => {
    const q = productQuery.trim();
    if (q.length < 3) {
      setPanelError('Informe o nome (3+ caracteres).');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setProductLoading(true);
    setPanelError(null);
    setProductResults([]);
    setAppliedBarcode(null);
    setSelectedBarcode(null);

    try {
      const hits = await searchAdegaProducts(q, controller.signal);
      setProductResults(hits);
      if (!hits.length) {
        setPanelError('Nenhum produto no catálogo.');
        return;
      }
      setSelectedBarcode(hits[0].barcode);
    } catch (err) {
      if (controller.signal.aborted) return;
      setPanelError(err instanceof Error ? err.message : 'Falha na busca de produto.');
    } finally {
      if (!controller.signal.aborted) setProductLoading(false);
    }
  }, [productQuery]);

  const confirmSelectedProduct = useCallback(() => {
    if (!selectedProduct) return;
    void applyProduct(selectedProduct);
  }, [applyProduct, selectedProduct]);

  const productBusy = productLoading || Boolean(importingId);
  const showProductPicker = productResults.length > 0;
  const canConfirm =
    Boolean(selectedProduct) && selectedBarcode !== appliedBarcode && !productBusy;

  return (
    <section className={styles.formAssist}>
      <div className={styles.formAssistRow}>
        {imageUrl ? (
          <img src={imageUrl} alt="" className={styles.formAssistPreview} loading="lazy" decoding="async" />
        ) : (
          <span className={styles.formAssistPreviewFallback} aria-hidden>
            🍾
          </span>
        )}

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
          prefixButtons={
            <button
              type="button"
              className={styles.formAssistBtnPrimary}
              disabled={productBusy || productQuery.trim().length < 3}
              onClick={() => void runProductSearch()}
            >
              {productLoading ? '…' : appliedBarcode ? '✓ Dados' : 'Auto-preencher'}
            </button>
          }
          onImageUrlInputChange={onImageUrlInputChange}
          onApplyImageUrl={onApplyImageUrl}
          onClearPhoto={onClearPhoto}
          onPhotoFile={onPhotoFile}
          onImageUrl={onImageUrl}
        />
      </div>

      {showProductPicker ? (
        <div className={styles.formAssistProductPicker}>
          <p className={styles.formAssistPickerHint}>
            {productResults.length === 1
              ? 'Confirme se é este produto'
              : `${productResults.length} opções — escolha e confirme`}
          </p>
          <ul className={styles.formAssistProductList}>
            {productResults.map((result) => {
              const isSelected = selectedBarcode === result.barcode;
              const isApplied = appliedBarcode === result.barcode;
              return (
                <li key={result.barcode}>
                  <button
                    type="button"
                    className={`${styles.formAssistProductItem} ${
                      isSelected ? styles.formAssistProductItemSelected : ''
                    } ${isApplied ? styles.formAssistProductItemApplied : ''}`}
                    disabled={productBusy}
                    onClick={() => setSelectedBarcode(result.barcode)}
                    aria-pressed={isSelected}
                  >
                    {result.imageUrl ? (
                      <img
                        src={result.imageUrl}
                        alt=""
                        className={styles.formAssistProductThumb}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className={styles.formAssistProductThumbFallback} aria-hidden>
                        🍾
                      </span>
                    )}
                    <span className={styles.formAssistProductCopy}>
                      <span className={styles.formAssistProductName}>{result.name}</span>
                      {productMeta(result) ? (
                        <span className={styles.formAssistProductMeta}>{productMeta(result)}</span>
                      ) : null}
                    </span>
                    {isApplied ? (
                      <span className={styles.formAssistProductCheck} aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={styles.formAssistConfirmRow}>
            <button
              type="button"
              className={styles.formAssistConfirmBtn}
              disabled={!canConfirm}
              onClick={confirmSelectedProduct}
            >
              {importingId ? 'Aplicando…' : 'Confirmar produto'}
            </button>
          </div>
        </div>
      ) : null}

      {panelError ? <p className={styles.formError}>{panelError}</p> : null}
    </section>
  );
}
