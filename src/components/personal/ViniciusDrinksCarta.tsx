import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fileToDrinkImageUrl } from '../../lib/drinkCartaImage';
import { applyDiscoverFilters, decodeBarShare } from '../../lib/drinkCartaDiscover';
import {
  VINICIUS_DRINKS,
  VINICIUS_DRINKS_BANNER_HEIGHT,
  VINICIUS_DRINKS_BANNER_URL,
  VINICIUS_DRINKS_BANNER_WIDTH,
} from '../../lib/viniciusDrinksCarta';
import {
  addCustomDrink,
  addCustomDrinks,
  clearDrinkOverrideField,
  defaultDrinkImageUrl,
  filterVisibleDrinks,
  findResolvedDrink,
  getDrinkMeta,
  isFavorite,
  listTriedSlugs,
  listWantToTrySlugs,
  loadDrinkCartaStore,
  resolveDrinks,
  saveDrinkCartaStore,
  syncDrinkCartaStoreFromCloud,
  toggleFavorite,
  toggleHidden,
  updateDrinkMeta,
  updateDrinkOverride,
  type DrinkCartaOverride,
  type DrinkCartaStore,
} from '../../lib/viniciusDrinksCartaStore';
import type { ViniciusDrink } from '../../lib/viniciusDrinksCarta';
import {
  loadAdegaItems,
  syncAdegaItemsFromCloud,
  type AdegaItem,
} from '../../lib/viniciusAdega';
import {
  filterDrinksByAdega,
  formatMissingIngredients,
  getDrinkSuggestions,
  matchDrinkToAdega,
  matchDrinksToAdega,
} from '../../lib/drinkAdegaMatch';
import { suggestDrinkSubstitutions } from '../../lib/drinkSubstitutions';
import { DrinkAdegaAvailability } from './DrinkAdegaAvailability';
import { DrinkThumb } from './DrinkThumb';
import { DrinkAdegaSuggestions } from './DrinkAdegaSuggestions';
import { DrinkCartaDiscoverBar, type DiscoverFilters } from './DrinkCartaDiscoverBar';
import { DrinkCartaEditor } from './DrinkCartaEditor';
import { DrinkGuidedPrep } from './DrinkGuidedPrep';
import { DrinkNewSuggestions } from './DrinkNewSuggestions';
import { DrinkPersonalMetaPanel } from './DrinkPersonalMetaPanel';
import { DrinkRecipeToolkit } from './DrinkRecipeToolkit';
import styles from './ViniciusDrinksCarta.module.css';

const DEFAULT_FILTERS: DiscoverFilters = {
  search: '',
  category: null,
  baseSpirit: null,
  flavor: null,
  collection: null,
  adegaMode: 'all',
  favoritesOnly: false,
  triedOnly: false,
  wantToTryOnly: false,
};

export function ViniciusDrinksCarta() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeSlug = searchParams.get('drink');
  const editing = searchParams.get('edit') === '1';
  const barShareParam = searchParams.get('barShare');

  const [store, setStore] = useState<DrinkCartaStore>(() => loadDrinkCartaStore(userId));
  const [adegaItems, setAdegaItems] = useState<AdegaItem[]>(() => loadAdegaItems(userId));
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [editorSlug, setEditorSlug] = useState<string | null>(null);
  const [newDrinksOpen, setNewDrinksOpen] = useState(false);
  const [guidedPrepOpen, setGuidedPrepOpen] = useState(false);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStore(loadDrinkCartaStore(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void syncDrinkCartaStoreFromCloud(userId).then((cloudStore) => {
      if (cloudStore) setStore(cloudStore);
    });
  }, [userId]);

  useEffect(() => {
    setAdegaItems(loadAdegaItems(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void syncAdegaItemsFromCloud(userId).then((cloudItems) => {
      if (cloudItems) setAdegaItems(cloudItems);
    });
  }, [userId]);

  const drinks = useMemo(() => filterVisibleDrinks(resolveDrinks(store), store), [store]);
  const favoriteSlugs = useMemo(() => new Set(store.favorites ?? []), [store.favorites]);
  const triedSlugs = useMemo(() => new Set(listTriedSlugs(store)), [store]);
  const wantToTrySlugs = useMemo(() => new Set(listWantToTrySlugs(store)), [store]);
  const adegaMatches = useMemo(() => matchDrinksToAdega(drinks, adegaItems), [drinks, adegaItems]);
  const drinkSuggestions = useMemo(
    () => getDrinkSuggestions(drinks, adegaItems),
    [drinks, adegaItems],
  );
  const readyDrinkCount = drinkSuggestions.ready.length;
  const almostDrinkCount = useMemo(
    () => filterDrinksByAdega(drinks, adegaItems, 'almost').length,
    [drinks, adegaItems],
  );
  const hasAdegaStock = adegaItems.some((item) => item.quantity > 0);
  const barShareSnapshot = useMemo(
    () => (barShareParam ? decodeBarShare(barShareParam) : null),
    [barShareParam],
  );

  const visibleDrinks = useMemo(
    () =>
      applyDiscoverFilters(drinks, {
        search: filters.search,
        category: filters.category,
        baseSpirit: filters.baseSpirit,
        flavor: filters.flavor,
        collection: filters.collection,
        adegaItems,
        adegaMode: filters.adegaMode,
        favoritesOnly: filters.favoritesOnly,
        triedOnly: filters.triedOnly,
        wantToTryOnly: filters.wantToTryOnly,
        favoriteSlugs,
        triedSlugs,
        wantToTrySlugs,
      }),
    [drinks, filters, adegaItems, favoriteSlugs, triedSlugs, wantToTrySlugs],
  );

  const activeDrink = useMemo(
    () => findResolvedDrink(activeSlug, store),
    [activeSlug, store],
  );
  const editorDrink = useMemo(
    () => (editorSlug ? findResolvedDrink(editorSlug, store) ?? null : null),
    [editorSlug, store],
  );
  const activeAdegaMatch = useMemo(
    () => (activeDrink ? matchDrinkToAdega(activeDrink, adegaItems) : null),
    [activeDrink, adegaItems],
  );
  const activeIsFavorite = activeDrink ? isFavorite(store, activeDrink.slug) : false;
  const activeIsHidden = activeDrink ? (store.hiddenSlugs ?? []).includes(activeDrink.slug) : false;
  const activeDrinkMeta = activeDrink ? getDrinkMeta(store, activeDrink.slug) : {};
  const activeSubstitutions = useMemo(
    () => (activeDrink ? suggestDrinkSubstitutions(activeDrink, adegaItems) : []),
    [activeDrink, adegaItems],
  );

  useEffect(() => {
    if (!activeSlug) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeSlug]);

  const setEditing = (next: boolean) => {
    const params = new URLSearchParams(searchParams);
    params.set('drinks', '1');
    if (next) params.set('edit', '1');
    else params.delete('edit');
    navigate(`/pessoal?${params.toString()}`, { replace: true });
    if (!next) setEditorSlug(null);
  };

  const openDrink = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('drinks', '1');
    params.set('drink', slug);
    navigate(`/pessoal?${params.toString()}`);
  };

  const backToList = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('drink');
    navigate(`/pessoal?${params.toString()}`);
  };

  const persistStore = (next: DrinkCartaStore) => {
    setStore(next);
    if (userId) saveDrinkCartaStore(userId, next);
  };

  const handleSaveDrink = (slug: string, patch: DrinkCartaOverride) => {
    persistStore(updateDrinkOverride(store, slug, patch));
  };

  const handleResetField = (slug: string, field: keyof DrinkCartaOverride) => {
    persistStore(clearDrinkOverrideField(store, slug, field));
  };

  const handleAddSuggestedDrink = (drink: ViniciusDrink) => {
    persistStore(addCustomDrink(store, drink));
  };

  const handleAddSuggestedDrinks = (newDrinks: ViniciusDrink[]) => {
    persistStore(addCustomDrinks(store, newDrinks));
  };

  const handleToggleFavorite = (slug: string) => {
    persistStore(toggleFavorite(store, slug));
  };

  const handleToggleHidden = (slug: string) => {
    persistStore(toggleHidden(store, slug));
  };

  const handleDrinkMetaChange = (slug: string, patch: Parameters<typeof updateDrinkMeta>[2]) => {
    persistStore(updateDrinkMeta(store, slug, patch));
  };

  const bannerImage = store.bannerImageUrl ?? VINICIUS_DRINKS_BANNER_URL;

  if (activeDrink) {
    return (
      <div className={styles.carta}>
        <div className={styles.cartaToolbar}>
          <button type="button" className={styles.backLink} onClick={backToList}>
            ← Carta
          </button>
          <div className={styles.cartaToolbarActions}>
            {!editing ? (
              <>
                <button
                  type="button"
                  className={`${styles.favoriteBtn} ${activeIsFavorite ? styles.favoriteBtnActive : ''}`}
                  onClick={() => handleToggleFavorite(activeDrink.slug)}
                  aria-label={activeIsFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  aria-pressed={activeIsFavorite}
                >
                  ★
                </button>
                <button
                  type="button"
                  className={styles.hideBtn}
                  onClick={() => handleToggleHidden(activeDrink.slug)}
                >
                  {activeIsHidden ? 'Mostrar na carta' : 'Ocultar da carta'}
                </button>
              </>
            ) : null}
            <button
              type="button"
              className={editing ? styles.editModeBtnActive : styles.editModeBtn}
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Concluído' : 'Editar'}
            </button>
            {editing ? (
              <button
                type="button"
                className={styles.editToolbarBtn}
                onClick={() => setEditorSlug(activeDrink.slug)}
              >
                Receita
              </button>
            ) : null}
          </div>
        </div>

        <article className={styles.detail}>
          <div className={styles.detailMedia}>
            <div className={editing ? styles.mediaEditWrap : undefined}>
              <DrinkThumb
                src={activeDrink.imageUrl}
                alt=""
                className={styles.detailPhoto}
              />
              {editing ? (
                <button
                  type="button"
                  className={styles.mediaEditBtn}
                  onClick={() => setEditorSlug(activeDrink.slug)}
                  aria-label="Alterar foto do drink"
                >
                  ✎ Foto
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.detailBody}>
            <h2 className={styles.detailTitle}>{activeDrink.title}</h2>
            <p className={styles.detailTagline}>{activeDrink.tagline}</p>

            {!editing ? (
              <DrinkPersonalMetaPanel
                meta={activeDrinkMeta}
                onChange={(patch) => handleDrinkMetaChange(activeDrink.slug, patch)}
              />
            ) : null}

            {activeAdegaMatch && hasAdegaStock ? (
              <DrinkAdegaAvailability
                match={activeAdegaMatch}
                substitutions={activeSubstitutions}
              />
            ) : null}

            {!editing ? (
              <button
                type="button"
                className={styles.guidedPrepLaunch}
                onClick={() => setGuidedPrepOpen(true)}
              >
                Modo preparo guiado
              </button>
            ) : null}

            <DrinkRecipeToolkit key={activeDrink.slug} drink={activeDrink} />
          </div>
        </article>

        <DrinkGuidedPrep
          drink={activeDrink}
          open={guidedPrepOpen}
          onClose={() => setGuidedPrepOpen(false)}
        />

        <DrinkCartaEditor
          open={editorSlug === activeDrink.slug}
          drink={editorDrink}
          defaultImageUrl={defaultDrinkImageUrl(activeDrink.slug, store)}
          userId={userId}
          onClose={() => setEditorSlug(null)}
          onSave={handleSaveDrink}
          onResetField={handleResetField}
        />
      </div>
    );
  }

  return (
    <div className={styles.carta}>
      <div className={styles.cartaToolbar}>
        <p className={styles.cartaToolbarHint}>
          {editing
            ? 'Toque em ✎ para editar foto e receita de cada drink.'
            : `${visibleDrinks.length} receitas na carta`}
        </p>
        <div className={styles.cartaToolbarActions}>
          {!editing ? (
            <button
              type="button"
              className={styles.newDrinksBtn}
              onClick={() => setNewDrinksOpen(true)}
            >
              ✨ Novos drinks
            </button>
          ) : null}
          <button
            type="button"
            className={editing ? styles.editModeBtnActive : styles.editModeBtn}
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Concluído' : 'Editar carta'}
          </button>
        </div>
      </div>

      <header className={styles.banner}>
        <div className={styles.bannerArtWrap}>
          <img
            src={bannerImage}
            alt="Carta de Drinks"
            className={styles.bannerArt}
            width={VINICIUS_DRINKS_BANNER_WIDTH}
            height={VINICIUS_DRINKS_BANNER_HEIGHT}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          {editing ? (
            <div className={styles.bannerEditActions}>
              <button
                type="button"
                className={styles.mediaEditBtn}
                onClick={() => bannerFileRef.current?.click()}
                aria-label="Alterar foto do banner"
              >
                ✎ Banner
              </button>
              {store.bannerImageUrl ? (
                <button
                  type="button"
                  className={styles.mediaResetBtn}
                  onClick={() => {
                    if (!userId) return;
                    persistStore({ ...store, bannerImageUrl: undefined });
                  }}
                >
                  Restaurar padrão
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <input
          ref={bannerFileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={styles.editorFileInput}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !userId) return;
            try {
              const url = await fileToDrinkImageUrl(file, { userId, kind: 'banner' });
              persistStore({ ...store, bannerImageUrl: url });
            } catch {
              /* ignore */
            } finally {
              e.target.value = '';
            }
          }}
        />
        <div className={styles.bannerMeta}>
          <span className={styles.bannerPill}>{VINICIUS_DRINKS.length} receitas</span>
          {hasAdegaStock && readyDrinkCount > 0 ? (
            <span className={styles.bannerPillReady}>{readyDrinkCount} com sua adega</span>
          ) : null}
          <span className={styles.bannerPill}>Bar digital</span>
        </div>
      </header>

      {barShareSnapshot ? (
        <p className={styles.barShareBanner}>
          Bar compartilhado: {barShareSnapshot.ready.length} prontos
          {barShareSnapshot.almost.length > 0
            ? ` · ${barShareSnapshot.almost.length} quase prontos (${barShareSnapshot.almost.join(', ')})`
            : ''}
          {barShareSnapshot.ready.length > 0 ? ` — ${barShareSnapshot.ready.join(', ')}` : ''}
        </p>
      ) : null}

      {!editing ? (
        <DrinkCartaDiscoverBar
          drinks={drinks}
          adegaItems={adegaItems}
          hasAdegaStock={hasAdegaStock}
          readyCount={readyDrinkCount}
          almostCount={almostDrinkCount}
          favoriteCount={favoriteSlugs.size}
          triedCount={triedSlugs.size}
          wantToTryCount={wantToTrySlugs.size}
          filters={filters}
          onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onOpenDrink={openDrink}
        />
      ) : null}

      {!editing && hasAdegaStock ? (
        <DrinkAdegaSuggestions
          drinks={drinks}
          adegaItems={adegaItems}
          onOpenDrink={openDrink}
          onShowAllReady={() => setFilters((prev) => ({ ...prev, adegaMode: 'ready' }))}
        />
      ) : !editing && !hasAdegaStock ? (
        <p className={styles.adegaEmptyHint}>
          Cadastre bebidas na{' '}
          <button type="button" className={styles.adegaEmptyLink} onClick={() => navigate('/pessoal?adega=1')}>
            Minha adega
          </button>{' '}
          para ver quais drinks você consegue fazer.
        </p>
      ) : null}

      {!editing && filters.adegaMode !== 'all' ? (
        <div className={styles.cartaSectionHead}>
          <h3 className={styles.cartaSectionTitle}>
            {filters.adegaMode === 'ready' ? 'Posso fazer com a adega' : 'Quase posso fazer'}
          </h3>
        </div>
      ) : null}

      {filters.adegaMode !== 'all' && visibleDrinks.length === 0 ? (
        <div className={styles.adegaEmptyState}>
          <p className={styles.adegaEmptyStateTitle}>
            {filters.adegaMode === 'ready'
              ? 'Nenhum drink completo por enquanto'
              : 'Nenhum drink quase completo'}
          </p>
          <p className={styles.adegaEmptyStateText}>
            {filters.adegaMode === 'ready'
              ? 'Só aparecem drinks com todos os ingredientes na adega.'
              : 'Só aparecem drinks que faltam 1 ou 2 itens.'}
          </p>
          <button
            type="button"
            className={styles.adegaEmptyStateBtn}
            onClick={() => setFilters((prev) => ({ ...prev, adegaMode: 'all' }))}
          >
            Ver todas as receitas
          </button>
        </div>
      ) : (
      <ul className={styles.list}>
        {visibleDrinks.map((drink) => {
          const match = adegaMatches.get(drink.slug);
          const drinkIsFavorite = favoriteSlugs.has(drink.slug);
          const drinkMeta = getDrinkMeta(store, drink.slug);
          return (
          <li key={drink.slug}>
            {editing ? (
              <div className={`${styles.card} ${styles.cardEditing}`}>
                <button
                  type="button"
                  className={styles.cardEditMedia}
                  onClick={() => setEditorSlug(drink.slug)}
                  aria-label={`Editar ${drink.title}`}
                >
                  <span className={styles.cardMedia}>
                    <DrinkThumb src={drink.imageUrl} alt="" className={styles.cardMediaImg} />
                  </span>
                  <span className={styles.cardEditBadge}>✎</span>
                </button>
                <button
                  type="button"
                  className={styles.cardEditBody}
                  onClick={() => setEditorSlug(drink.slug)}
                >
                  <span className={styles.cardTitle}>{drink.title}</span>
                  <span className={styles.cardTagline}>{drink.tagline}</span>
                </button>
                <button
                  type="button"
                  className={styles.cardPreviewBtn}
                  onClick={() => openDrink(drink.slug)}
                  aria-label={`Ver ${drink.title}`}
                >
                  →
                </button>
              </div>
            ) : (
              <button type="button" className={styles.card} onClick={() => openDrink(drink.slug)}>
                <span className={styles.cardMedia}>
                  <DrinkThumb src={drink.imageUrl} alt="" className={styles.cardMediaImg} />
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitleRow}>
                    <span className={styles.cardTitle}>{drink.title}</span>
                    {drinkIsFavorite ? (
                      <span className={styles.favoriteBtnActive} aria-hidden>
                        ★
                      </span>
                    ) : null}
                    {drinkMeta.tried ? (
                      <span className={styles.cardTriedBadge} title="Já provei">
                        ✓
                      </span>
                    ) : null}
                    {drinkMeta.rating ? (
                      <span className={styles.cardRatingBadge} title={`Nota ${drinkMeta.rating}`}>
                        ★{drinkMeta.rating}
                      </span>
                    ) : null}
                    {match?.status === 'ready' ? (
                      <span className={styles.cardAdegaBadge}>Adega</span>
                    ) : null}
                    {match && match.status !== 'ready' && match.missingLabels.length > 0 ? (
                      <span
                        className={styles.cardAdegaBadgePartial}
                        title={`Falta: ${formatMissingIngredients(match)}`}
                      >
                        Falta
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.cardTagline}>{drink.tagline}</span>
                  {match && match.missingLabels.length > 0 ? (
                    <span className={styles.cardAdegaMissing}>
                      Falta: {formatMissingIngredients(match)}
                    </span>
                  ) : null}
                </span>
                <span className={styles.cardArrow} aria-hidden>
                  →
                </span>
              </button>
            )}
          </li>
          );
        })}
      </ul>
      )}

      <DrinkCartaEditor
        open={Boolean(editorSlug)}
        drink={editorDrink}
        defaultImageUrl={editorSlug ? defaultDrinkImageUrl(editorSlug, store) : undefined}
        userId={userId}
        onClose={() => setEditorSlug(null)}
        onSave={handleSaveDrink}
        onResetField={handleResetField}
      />

      <DrinkNewSuggestions
        open={newDrinksOpen}
        store={store}
        adegaItems={adegaItems}
        onClose={() => setNewDrinksOpen(false)}
        onAdd={handleAddSuggestedDrink}
        onAddMany={handleAddSuggestedDrinks}
      />
    </div>
  );
}
