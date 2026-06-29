import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  coffeeStockCategoriesInUse,
  filterCoffeeStockByCategory,
  searchCoffeeStock,
} from '../../lib/coffeeCartaDiscover';
import {
  VINICIUS_COFFEE_BANNER_HEIGHT,
  VINICIUS_COFFEE_BANNER_URL,
  VINICIUS_COFFEE_BANNER_WIDTH,
} from '../../lib/viniciusCoffeeCarta';
import {
  COFFEE_CAPSULE_SYSTEMS,
  COFFEE_STOCK_CATEGORY_PRESETS,
  categoryEmoji,
  categoryToCapsuleSystem,
  createCoffeeStockId,
  findCoffeeStockByCatalog,
  ensureCoffeeCollectionReset,
  loadCoffeeStock,
  normalizeCoffeeStockInput,
  saveCoffeeStock,
  syncCoffeeStockFromCloud,
  type CoffeeCapsuleSystem,
  type CoffeeCupSize,
  type CoffeeStockInput,
  type CoffeeStockItem,
} from '../../lib/viniciusCoffeeStock';
import {
  COFFEE_CUP_SIZES,
  joinExtraImageUrls,
  parseExtraImageUrls,
} from '../../lib/coffeeCapsuleMeta';
import { useAuth } from '../../contexts/AuthContext';
import { useMaxWidth } from '../../hooks/useMaxWidth';
import {
  loadCoffeeStockViewMode,
  saveCoffeeStockViewMode,
  type CoffeeStockViewMode,
} from '../../lib/coffeeStockView';
import { CoffeeCapsuleCard } from './CoffeeCapsuleCard';
import { CoffeeCapsuleCatalogPicker } from './CoffeeCapsuleCatalogPicker';
import { CoffeeCapsuleDetail } from './CoffeeCapsuleDetail';
import { CoffeeStockCards } from './CoffeeStockCards';
import { CoffeeStockViewMenu } from './CoffeeStockViewMenu';
import {
  catalogEntryToStockPrefill,
  COFFEE_CAPSULE_CATALOG_COUNT,
  findCoffeeCapsuleCatalogEntry,
  isCatalogDisplayId,
  parseCatalogDisplayId,
  resolveCoffeeDisplayStock,
  type CoffeeCapsuleCatalogEntry,
} from '../../lib/coffeeCapsuleCatalog';
import { CoffeeStockPhotoTools } from './CoffeeStockPhotoTools';
import {
  CoffeeCategoryFilterIcon,
  coffeeCategoryFilterLabel,
} from './CoffeeCategoryFilterIcon';
import adegaStyles from './ViniciusAdega.module.css';
import styles from './ViniciusCoffee.module.css';

type CoffeeScreen = 'home' | 'collection' | 'favorites';

type StockFormState = {
  name: string;
  category: string;
  customCategory: string;
  brand: string;
  intensity: string;
  quantity: string;
  packSize: string;
  cupSize: CoffeeCupSize | '';
  origin: string;
  flavorNotes: string;
  description: string;
  ingredients: string;
  pricePaid: string;
  catalogUrl: string;
  extraImageUrls: string;
  catalogSlug: string;
  notes: string;
  imageUrl: string;
  imageUrlInput: string;
};

const EMPTY_STOCK_FORM: StockFormState = {
  name: '',
  category: COFFEE_STOCK_CATEGORY_PRESETS[0],
  customCategory: '',
  brand: '',
  intensity: '',
  quantity: '10',
  packSize: '10',
  cupSize: 'espresso',
  origin: '',
  flavorNotes: '',
  description: '',
  ingredients: '',
  pricePaid: '',
  catalogUrl: '',
  extraImageUrls: '',
  catalogSlug: '',
  notes: '',
  imageUrl: '',
  imageUrlInput: '',
};

const CAPSULE_CATEGORY_BY_SYSTEM: Record<CoffeeCapsuleSystem, string> = {
  'dolce-gusto': 'Cápsula Dolce Gusto',
  'tres-coracoes': 'Cápsula Três Corações',
  nespresso: 'Cápsula Nespresso',
};

const SYSTEM_CATEGORY_LABELS = new Set(Object.values(CAPSULE_CATEGORY_BY_SYSTEM));

const SCREEN_LABELS: Record<CoffeeScreen, string> = {
  home: 'Início',
  collection: 'Coleção',
  favorites: 'Favoritos',
};

function greeting(): { title: string; subtitle: string } {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      title: 'Bom dia',
      subtitle: 'Vamos preparar algo especial hoje.',
    };
  }
  if (hour < 18) {
    return {
      title: 'Boa tarde',
      subtitle: 'Hora de uma pausa com café.',
    };
  }
  return {
    title: 'Boa noite',
    subtitle: 'Um café para fechar o dia.',
  };
}

function parseScreen(value: string | null): CoffeeScreen {
  if (value === 'collection' || value === 'favorites') return value;
  return 'home';
}

type ViniciusCoffeeProps = {
  onBack?: () => void;
};

export function ViniciusCoffee({ onBack }: ViniciusCoffeeProps = {}) {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editing = searchParams.get('edit') === '1';
  const screen = parseScreen(searchParams.get('view'));
  const isMobileApp = useMaxWidth(899);
  const embeddedDesktop = Boolean(onBack && !isMobileApp);

  const [stock, setStock] = useState<CoffeeStockItem[]>(() => loadCoffeeStock(userId));
  const [stockViewMode, setStockViewMode] = useState<CoffeeStockViewMode>(() =>
    loadCoffeeStockViewMode(userId),
  );
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState<string | null>(null);
  const [systemFilter, setSystemFilter] = useState<CoffeeCapsuleSystem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewingStockItem, setViewingStockItem] = useState<CoffeeStockItem | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState<StockFormState>(EMPTY_STOCK_FORM);
  const [stockFormError, setStockFormError] = useState<string | null>(null);
  const [stockSaving, setStockSaving] = useState(false);
  const stockPhotoInputRef = useRef<HTMLInputElement>(null);
  const draftStockIdRef = useRef(createCoffeeStockId());

  const hero = useMemo(() => greeting(), []);

  useEffect(() => {
    if (!userId) {
      setStock([]);
      return;
    }
    const local = ensureCoffeeCollectionReset(userId);
    setStock(local);

    let cancelled = false;
    void syncCoffeeStockFromCloud(userId).then((cloud) => {
      if (!cancelled && cloud) setStock(cloud);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (!params.has('tab') && !params.has('receita')) return;
    params.delete('tab');
    params.delete('receita');
    navigate(`/pessoal?${params.toString()}`, { replace: true });
  }, [navigate, searchParams]);

  const displayStock = useMemo(() => resolveCoffeeDisplayStock(stock), [stock]);
  const collectionCount = displayStock.length;
  const stockCategories = useMemo(() => coffeeStockCategoriesInUse(displayStock), [displayStock]);
  const filterCategories = useMemo(
    () => stockCategories.filter((category) => !SYSTEM_CATEGORY_LABELS.has(category)),
    [stockCategories],
  );
  const inStockCount = useMemo(
    () => displayStock.filter((item) => item.quantity > 0).length,
    [displayStock],
  );
  const favorites = useMemo(() => displayStock.filter((item) => item.favorite), [displayStock]);
  const activeScreen: CoffeeScreen =
    embeddedDesktop && screen === 'home' ? 'collection' : screen;

  const filteredStock = useMemo(() => {
    let list = displayStock;
    if (activeScreen === 'favorites') {
      list = list.filter((item) => item.favorite);
    }
    list = searchCoffeeStock(list, stockSearch);
    if (systemFilter) {
      const category = CAPSULE_CATEGORY_BY_SYSTEM[systemFilter];
      list = list.filter(
        (item) => item.capsuleSystem === systemFilter || item.category === category,
      );
    }
    list = filterCoffeeStockByCategory(list, stockCategoryFilter);
    return list;
  }, [displayStock, stockSearch, stockCategoryFilter, systemFilter, activeScreen]);

  const handleStockViewModeChange = (mode: CoffeeStockViewMode) => {
    setStockViewMode(mode);
    if (userId) saveCoffeeStockViewMode(userId, mode);
  };

  const homeCarouselItems = useMemo(() => displayStock.slice(0, 12), [displayStock]);

  const persistStock = useCallback(
    (updater: CoffeeStockItem[] | ((prev: CoffeeStockItem[]) => CoffeeStockItem[])) => {
      setStock((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (userId) {
          void saveCoffeeStock(userId, next).then((err) => {
            if (err) console.warn('[coffee stock] sync:', err);
          });
        }
        return next;
      });
    },
    [userId],
  );

  const upsertStockFromDisplay = (
    displayItem: CoffeeStockItem,
    patch: Partial<CoffeeStockItem>,
  ) => {
    const now = new Date().toISOString();
    persistStock((prev) => {
      const byId = prev.findIndex((item) => item.id === displayItem.id);
      if (byId >= 0) {
        return prev.map((item, index) =>
          index === byId ? { ...item, ...patch, updatedAt: now } : item,
        );
      }
      if (displayItem.catalogSlug && displayItem.capsuleSystem) {
        return prev.map((item) =>
          item.catalogSlug === displayItem.catalogSlug &&
          item.capsuleSystem === displayItem.capsuleSystem
            ? { ...item, ...patch, updatedAt: now }
            : item,
        );
      }
      return prev;
    });
  };

  const setScreen = (next: CoffeeScreen) => {
    const params = new URLSearchParams(searchParams);
    params.set('coffee', '1');
    if (next === 'home') params.delete('view');
    else params.set('view', next);
    navigate(`/pessoal?${params.toString()}`, { replace: true });
  };

  const setEditing = (next: boolean) => {
    const params = new URLSearchParams(searchParams);
    params.set('coffee', '1');
    if (next) params.set('edit', '1');
    else params.delete('edit');
    navigate(`/pessoal?${params.toString()}`, { replace: true });
  };

  const openStockCreate = (presetCategory?: string) => {
    draftStockIdRef.current = createCoffeeStockId();
    setEditingStockId(null);
    setStockFormError(null);
    setStockForm({
      ...EMPTY_STOCK_FORM,
      category: presetCategory ?? COFFEE_STOCK_CATEGORY_PRESETS[0],
    });
    setCatalogPickerOpen(true);
  };

  const applyCatalogEntry = (entry: CoffeeCapsuleCatalogEntry) => {
    const prefill = catalogEntryToStockPrefill(entry);
    const existing = findCoffeeStockByCatalog(stock, entry.slug, entry.system);
    setStockFormError(null);
    setEditingStockId(existing?.id ?? null);
    draftStockIdRef.current = existing?.id ?? createCoffeeStockId();
    setStockForm({
      ...EMPTY_STOCK_FORM,
      name: prefill.name,
      category: prefill.category,
      brand: prefill.brand ?? '',
      intensity: prefill.intensity != null ? String(prefill.intensity) : '',
      quantity: String(existing?.quantity ?? 10),
      packSize: prefill.packSize != null ? String(prefill.packSize) : '',
      cupSize: prefill.cupSize ?? '',
      origin: prefill.origin ?? '',
      flavorNotes: prefill.flavorNotes ?? '',
      description: prefill.description ?? '',
      ingredients: prefill.ingredients ?? '',
      pricePaid: prefill.pricePaid != null ? String(prefill.pricePaid) : '',
      catalogUrl: prefill.catalogUrl ?? '',
      extraImageUrls: joinExtraImageUrls(prefill.extraImageUrls),
      catalogSlug: prefill.catalogSlug,
      imageUrl: prefill.imageUrl ?? '',
      imageUrlInput: prefill.imageUrl ?? '',
    });
    setCatalogPickerOpen(false);
    setStockDialogOpen(true);
  };

  const openManualStockCreate = (presetCategory?: string) => {
    draftStockIdRef.current = createCoffeeStockId();
    setEditingStockId(null);
    setStockForm({
      ...EMPTY_STOCK_FORM,
      category: presetCategory ?? COFFEE_STOCK_CATEGORY_PRESETS[0],
    });
    setCatalogPickerOpen(false);
    setStockDialogOpen(true);
  };

  const openStockEdit = (item: CoffeeStockItem) => {
    let target = item;
    if (isCatalogDisplayId(item.id)) {
      const parsed = parseCatalogDisplayId(item.id);
      const entry = parsed ? findCoffeeCapsuleCatalogEntry(parsed.slug) : undefined;
      if (entry && parsed) {
        const prefill = catalogEntryToStockPrefill(entry);
        const existing = findCoffeeStockByCatalog(stock, parsed.slug, parsed.system);
        draftStockIdRef.current = existing?.id ?? createCoffeeStockId();
        setEditingStockId(existing?.id ?? null);
        setStockFormError(null);
        setStockForm({
          ...EMPTY_STOCK_FORM,
          name: prefill.name,
          category: prefill.category,
          brand: prefill.brand ?? '',
          intensity: prefill.intensity != null ? String(prefill.intensity) : '',
          quantity: String(item.quantity),
          packSize: prefill.packSize != null ? String(prefill.packSize) : '',
          cupSize: prefill.cupSize ?? '',
          origin: prefill.origin ?? '',
          flavorNotes: prefill.flavorNotes ?? '',
          description: prefill.description ?? '',
          ingredients: prefill.ingredients ?? '',
          pricePaid: prefill.pricePaid != null ? String(prefill.pricePaid) : '',
          catalogUrl: prefill.catalogUrl ?? '',
          catalogSlug: prefill.catalogSlug,
          extraImageUrls: joinExtraImageUrls(prefill.extraImageUrls),
          imageUrl: prefill.imageUrl ?? '',
          imageUrlInput: prefill.imageUrl ?? '',
        });
        setStockDialogOpen(true);
        return;
      }
    }

    const preset = COFFEE_STOCK_CATEGORY_PRESETS.includes(
      target.category as (typeof COFFEE_STOCK_CATEGORY_PRESETS)[number],
    );
    setEditingStockId(target.id);
    setStockForm({
      name: item.name,
      category: preset ? item.category : 'Outro',
      customCategory: preset ? '' : item.category,
      brand: item.brand ?? '',
      intensity: item.intensity != null ? String(item.intensity) : '',
      quantity: String(item.quantity),
      packSize: item.packSize != null ? String(item.packSize) : '',
      cupSize: item.cupSize ?? '',
      origin: item.origin ?? '',
      flavorNotes: item.flavorNotes ?? '',
      description: item.description ?? '',
      ingredients: item.ingredients ?? '',
      pricePaid: item.pricePaid != null ? String(item.pricePaid) : '',
      catalogUrl: item.catalogUrl ?? '',
      catalogSlug: item.catalogSlug ?? '',
      extraImageUrls: joinExtraImageUrls(item.extraImageUrls),
      notes: item.notes ?? '',
      imageUrl: item.imageUrl ?? '',
      imageUrlInput: item.imageUrl ?? '',
    });
    setStockDialogOpen(true);
  };

  const handleStockSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStockFormError(null);
    if (!userId) {
      setStockFormError('Faça login para salvar seu estoque.');
      return;
    }
    const category =
      stockForm.category === 'Outro' ? stockForm.customCategory.trim() : stockForm.category;
    const input: CoffeeStockInput = {
      name: stockForm.name,
      category,
      brand: stockForm.brand || undefined,
      intensity: stockForm.intensity ? Number(stockForm.intensity) : undefined,
      quantity: Number(stockForm.quantity),
      packSize: stockForm.packSize ? Number(stockForm.packSize) : undefined,
      cupSize: stockForm.cupSize || undefined,
      origin: stockForm.origin || undefined,
      flavorNotes: stockForm.flavorNotes || undefined,
      description: stockForm.description || undefined,
      ingredients: stockForm.ingredients || undefined,
      pricePaid: stockForm.pricePaid ? Number(stockForm.pricePaid.replace(',', '.')) : undefined,
      catalogUrl: stockForm.catalogUrl || undefined,
      catalogSlug: stockForm.catalogSlug || undefined,
      extraImageUrls: parseExtraImageUrls(stockForm.extraImageUrls),
      notes: stockForm.notes || undefined,
      capsuleSystem: categoryToCapsuleSystem(category),
      imageUrl: stockForm.imageUrl || undefined,
    };
    const normalized = normalizeCoffeeStockInput(input);
    if (!normalized) {
      setStockFormError('Preencha nome e sistema da cápsula.');
      return;
    }

    const now = new Date().toISOString();
    const existingByCatalog =
      !editingStockId && normalized.catalogSlug && normalized.capsuleSystem
        ? findCoffeeStockByCatalog(stock, normalized.catalogSlug, normalized.capsuleSystem)
        : undefined;
    const targetId = editingStockId ?? existingByCatalog?.id;

    const nextStock = targetId
      ? stock.map((item) =>
          item.id === targetId
            ? {
                ...item,
                ...normalized,
                favorite: stock.find((entry) => entry.id === targetId)?.favorite,
                updatedAt: now,
              }
            : item,
        )
      : [
          ...stock,
          {
            id: draftStockIdRef.current,
            ...normalized,
            createdAt: now,
            updatedAt: now,
          },
        ];

    setStockSaving(true);
    try {
      setStock(nextStock);
      const err = await saveCoffeeStock(userId, nextStock);
      if (err) {
        setStockFormError(`Não foi possível salvar: ${err}`);
        return;
      }
      draftStockIdRef.current = createCoffeeStockId();
      setStockDialogOpen(false);
    } finally {
      setStockSaving(false);
    }
  };

  const handleDeleteStock = (id: string) => {
    persistStock(stock.filter((item) => item.id !== id));
    setViewingStockItem(null);
  };

  const toggleStockQuantity = (id: string) => {
    const displayItem = displayStock.find((item) => item.id === id);
    if (!displayItem) return;
    const nextQty = displayItem.quantity > 0 ? 0 : displayItem.packSize ?? 1;
    upsertStockFromDisplay(displayItem, { quantity: nextQty });
  };

  const toggleFavorite = (id: string) => {
    const displayItem = displayStock.find((item) => item.id === id);
    if (!displayItem) return;
    upsertStockFromDisplay(displayItem, { favorite: !displayItem.favorite });
  };

  const openItem = (item: CoffeeStockItem) => {
    if (editing) {
      openStockEdit(item);
      return;
    }
    setViewingStockItem(item);
  };

  const clearFilters = () => {
    setSystemFilter(null);
    setStockCategoryFilter(null);
    setStockSearch('');
  };

  const detailItem = viewingStockItem
    ? displayStock.find((entry) => entry.id === viewingStockItem.id) ?? viewingStockItem
    : null;

  if (detailItem && !stockDialogOpen) {
    return (
      <div
        className={`${styles.app} ${embeddedDesktop ? styles.appDesktop : ''} nexus-coffee-app nexus-personal-app-root`}
      >
        <CoffeeCapsuleDetail
          item={detailItem}
          onBack={() => setViewingStockItem(null)}
          onEdit={() => {
            setViewingStockItem(null);
            openStockEdit(detailItem);
          }}
          onToggleQuantity={() => toggleStockQuantity(detailItem.id)}
          onToggleFavorite={() => toggleFavorite(detailItem.id)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.app} ${embeddedDesktop ? styles.appDesktop : ''} nexus-coffee-app nexus-personal-app-root`}
    >
      {embeddedDesktop ? (
        <>
          <div className={adegaStyles.adegaToolbar}>
            <p className={adegaStyles.adegaToolbarHint}>
              {editing
                ? 'Toque em um item para editar ou use + para adicionar.'
                : `${collectionCount} na sua coleção · ${inStockCount} com estoque · catálogo ${COFFEE_CAPSULE_CATALOG_COUNT}`}
            </p>
            <div className={styles.desktopToolbarActions}>
              {editing ? (
                <button
                  type="button"
                  className={`${adegaStyles.addBtn} ${adegaStyles.toolbarAddBtn}`}
                  onClick={() => openStockCreate()}
                >
                  + Cápsula
                </button>
              ) : null}
              <button
                type="button"
                className={editing ? adegaStyles.editModeBtnActive : adegaStyles.editModeBtn}
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Concluído' : 'Editar coleção'}
              </button>
            </div>
          </div>

          <header className={adegaStyles.banner}>
            <div className={`${adegaStyles.bannerArtWrap} nexus-personal-banner-wrap`}>
              <img
                src={VINICIUS_COFFEE_BANNER_URL}
                alt="Café — catálogo de cápsulas"
                className={adegaStyles.bannerArt}
                width={VINICIUS_COFFEE_BANNER_WIDTH}
                height={VINICIUS_COFFEE_BANNER_HEIGHT}
                loading="eager"
                decoding="async"
              />
            </div>
            {collectionCount > 0 ? (
              <div className={adegaStyles.bannerMeta}>
                <span className={adegaStyles.stat}>{collectionCount} na coleção</span>
                <span className={adegaStyles.stat}>{inStockCount} com estoque</span>
                {favorites.length > 0 ? (
                  <span className={adegaStyles.stat}>{favorites.length} favoritas</span>
                ) : null}
              </div>
            ) : null}
          </header>

          <nav className={adegaStyles.adegaNav} aria-label="Busca e filtros do café">
            <div className={adegaStyles.toolbar}>
              <label className={adegaStyles.searchWrap}>
                <span className={adegaStyles.searchIcon} aria-hidden>
                  ⌕
                </span>
                <input
                  type="search"
                  className={adegaStyles.search}
                  placeholder="Buscar cápsula, marca ou nota…"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  aria-label="Buscar cápsulas"
                />
              </label>
              {!editing ? (
                <CoffeeStockViewMenu viewMode={stockViewMode} onViewModeChange={handleStockViewModeChange} />
              ) : null}
            </div>

            <div className={adegaStyles.filtersWrap}>
              <div className={adegaStyles.filters} role="group" aria-label="Filtrar catálogo">
                <button
                  type="button"
                  className={`${adegaStyles.filterBtn} ${adegaStyles.filterBtnIconOnly} ${activeScreen === 'collection' ? adegaStyles.filterBtnActive : ''}`}
                  onClick={() => setScreen('collection')}
                  aria-label={coffeeCategoryFilterLabel('collection')}
                  title={coffeeCategoryFilterLabel('collection')}
                  aria-pressed={activeScreen === 'collection'}
                >
                  <CoffeeCategoryFilterIcon id="collection" active={activeScreen === 'collection'} />
                </button>
                <button
                  type="button"
                  className={`${adegaStyles.filterBtn} ${adegaStyles.filterBtnIconOnly} ${activeScreen === 'favorites' ? adegaStyles.filterBtnActive : ''}`}
                  onClick={() => setScreen('favorites')}
                  aria-label={coffeeCategoryFilterLabel('favorites')}
                  title={coffeeCategoryFilterLabel('favorites')}
                  aria-pressed={activeScreen === 'favorites'}
                >
                  <CoffeeCategoryFilterIcon id="favorites" active={activeScreen === 'favorites'} />
                </button>
                {COFFEE_CAPSULE_SYSTEMS.map((system) => (
                  <button
                    key={system.id}
                    type="button"
                    className={`${adegaStyles.filterBtn} ${adegaStyles.filterBtnIconOnly} ${systemFilter === system.id ? adegaStyles.filterBtnActive : ''}`}
                    onClick={() =>
                      setSystemFilter((current) => (current === system.id ? null : system.id))
                    }
                    aria-label={system.label}
                    title={system.label}
                    aria-pressed={systemFilter === system.id}
                  >
                    <CoffeeCategoryFilterIcon
                      id={system.id}
                      active={systemFilter === system.id}
                    />
                  </button>
                ))}
                {filterCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`${adegaStyles.filterBtn} ${stockCategoryFilter === category ? adegaStyles.filterBtnActive : ''}`}
                    onClick={() =>
                      setStockCategoryFilter((current) => (current === category ? null : category))
                    }
                    title={category}
                  >
                    <span aria-hidden>{categoryEmoji(category)}</span>
                    <span className={styles.filterBtnLabel}>{category.replace(/^Cápsula /, '')}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </>
      ) : (
        <header className={`${styles.appHeader} ${embeddedDesktop ? styles.appHeaderEmbedded : ''}`}>
          {onBack && isMobileApp ? (
            <button type="button" className={styles.headerBtn} onClick={onBack} aria-label="Voltar ao cantinho">
              ←
            </button>
          ) : null}
          <h1 className={styles.appTitle}>MEU CAFÉ</h1>
          <div className={styles.headerActions}>
            {screen !== 'home' ? (
              <button
                type="button"
                className={styles.headerBtn}
                onClick={() => setFiltersOpen(true)}
                aria-label="Filtros"
              >
                ☰
              </button>
            ) : null}
            <button
              type="button"
              className={`${styles.headerBtn} ${editing ? styles.headerBtnActive : ''}`}
              onClick={() => setEditing(!editing)}
              aria-label={editing ? 'Concluir edição' : 'Editar coleção'}
            >
              {editing ? '✓' : '✎'}
            </button>
            <button
              type="button"
              className={`${styles.headerBtn} ${styles.headerBtnGold}`}
              onClick={() => openStockCreate(systemFilter ? CAPSULE_CATEGORY_BY_SYSTEM[systemFilter] : undefined)}
              aria-label="Adicionar cápsula"
            >
              +
            </button>
          </div>
        </header>
      )}

      <main className={styles.appMain}>
        {embeddedDesktop ? (
          <CoffeeStockCards
            items={filteredStock}
            editing={editing}
            viewMode={stockViewMode}
            emptyTitle={
              activeScreen === 'favorites'
                ? 'Nenhuma favorita'
                : filteredStock.length === 0 && collectionCount > 0
                  ? 'Nenhuma cápsula encontrada'
                  : 'Coleção vazia'
            }
            emptyText={
              activeScreen === 'favorites'
                ? 'Marque cápsulas com ♥ para vê-las aqui.'
                : filteredStock.length === 0 && collectionCount > 0
                  ? 'Tente outra busca ou limpe os filtros.'
                  : 'Adicione as cápsulas que você tem em casa — pelo catálogo ou manualmente.'
            }
            onCardClick={openItem}
            onEdit={openStockEdit}
            onDelete={handleDeleteStock}
            onToggleQuantity={toggleStockQuantity}
          />
        ) : screen === 'home' ? (
          <>
            <section className={styles.hero}>
              <div className={styles.heroCopy}>
                <p className={styles.heroEyebrow}>Menu de cápsulas</p>
                <h2 className={styles.heroTitle}>{hero.title}</h2>
                <p className={styles.heroSubtitle}>{hero.subtitle}</p>
                <div className={styles.heroStats}>
                  <span>{collectionCount} na coleção</span>
                  <span aria-hidden>·</span>
                  <span>{COFFEE_CAPSULE_CATALOG_COUNT} no catálogo</span>
                </div>
              </div>
              <div className={styles.heroVisual}>
                <img
                  src={VINICIUS_COFFEE_BANNER_URL}
                  alt=""
                  width={VINICIUS_COFFEE_BANNER_WIDTH}
                  height={VINICIUS_COFFEE_BANNER_HEIGHT}
                  className={styles.heroImg}
                />
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h3 className={styles.sectionTitle}>Por sistema</h3>
              </div>
              <div className={styles.systemCarousel}>
                {COFFEE_CAPSULE_SYSTEMS.map((system) => (
                  <button
                    key={system.id}
                    type="button"
                    className={styles.systemPill}
                    onClick={() => {
                      setSystemFilter(system.id);
                      setScreen('collection');
                    }}
                  >
                    <img src={system.icon} alt="" />
                    <span>{system.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h3 className={styles.sectionTitle}>Sua coleção</h3>
                {displayStock.length > 0 ? (
                  <button type="button" className={styles.sectionLink} onClick={() => setScreen('collection')}>
                    Ver tudo
                  </button>
                ) : null}
              </div>
              {homeCarouselItems.length > 0 ? (
                <div className={styles.capsuleCarousel}>
                  {homeCarouselItems.map((item) => (
                    <CoffeeCapsuleCard
                      key={item.id}
                      item={item}
                      layout="carousel"
                      editing={editing}
                      onOpen={openItem}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.sectionEmpty}>
                  <p>Sua coleção está vazia. Toque em + para adicionar o que você tem em casa.</p>
                  <button type="button" className={styles.goldBtn} onClick={() => openStockCreate()}>
                    Adicionar cápsula
                  </button>
                </div>
              )}
            </section>

            {favorites.length > 0 ? (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Favoritas</h3>
                  <button type="button" className={styles.sectionLink} onClick={() => setScreen('favorites')}>
                    Ver tudo
                  </button>
                </div>
                <div className={styles.capsuleCarousel}>
                  {favorites.slice(0, 8).map((item) => (
                    <CoffeeCapsuleCard
                      key={item.id}
                      item={item}
                      layout="carousel"
                      editing={editing}
                      onOpen={openItem}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <>
            <div className={styles.collectionToolbar}>
              <label className={styles.searchWrap}>
                <span className={styles.searchIcon} aria-hidden>
                  ⌕
                </span>
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Buscar cápsula, marca ou nota…"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  aria-label="Buscar cápsulas"
                />
              </label>
            </div>

            {(systemFilter || stockCategoryFilter) && (
              <div className={styles.activeFilters}>
                {systemFilter ? (
                  <button
                    type="button"
                    className={styles.activeFilterChip}
                    onClick={() => setSystemFilter(null)}
                    aria-label={`Remover filtro ${COFFEE_CAPSULE_SYSTEMS.find((s) => s.id === systemFilter)?.label}`}
                  >
                    <img
                      src={COFFEE_CAPSULE_SYSTEMS.find((s) => s.id === systemFilter)?.icon}
                      alt=""
                      className={styles.activeFilterChipIcon}
                    />
                    <span aria-hidden>×</span>
                  </button>
                ) : null}
                {stockCategoryFilter ? (
                  <button
                    type="button"
                    className={styles.activeFilterChip}
                    onClick={() => setStockCategoryFilter(null)}
                  >
                    {stockCategoryFilter} ×
                  </button>
                ) : null}
              </div>
            )}

            {filteredStock.length > 0 ? (
              <div className={styles.capsuleGrid}>
                {filteredStock.map((item) => (
                  <CoffeeCapsuleCard
                    key={item.id}
                    item={item}
                    layout="grid"
                    editing={editing}
                    onOpen={openItem}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.sectionEmpty}>
                <p>
                  {screen === 'favorites'
                    ? 'Nenhuma favorita por enquanto.'
                    : collectionCount === 0
                      ? 'Sua coleção está vazia. Adicione as cápsulas que você tem em casa.'
                      : 'Nenhuma cápsula encontrada.'}
                </p>
                <button
                  type="button"
                  className={styles.goldBtn}
                  onClick={() => (collectionCount === 0 ? openStockCreate() : clearFilters())}
                >
                  {collectionCount === 0 ? 'Adicionar cápsula' : 'Limpar filtros'}
                </button>
              </div>
            )}

            {editing && filteredStock.length > 0 ? (
              <p className={styles.editHint}>Toque em uma cápsula para editar ou remover.</p>
            ) : null}
          </>
        )}
      </main>

      {!embeddedDesktop ? (
        <nav className={styles.bottomNav} aria-label="Navegação do café">
          {(['home', 'collection', 'favorites'] as CoffeeScreen[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`${styles.bottomNavBtn} ${screen === id ? styles.bottomNavBtnActive : ''}`}
              onClick={() => setScreen(id)}
              aria-current={screen === id ? 'page' : undefined}
            >
              <span className={styles.bottomNavIcon} aria-hidden>
                {id === 'home' ? (
                  '⌂'
                ) : id === 'collection' ? (
                  <span className="material-symbols-outlined">apps</span>
                ) : (
                  <span className={`material-symbols-outlined ${screen === id ? styles.filterStarActive : ''}`}>
                    star
                  </span>
                )}
              </span>
              <span>{SCREEN_LABELS[id]}</span>
            </button>
          ))}
        </nav>
      ) : null}

      {filtersOpen && !embeddedDesktop ? (
        <div className={styles.overlay} role="presentation" onClick={() => setFiltersOpen(false)}>
          <div className={styles.filterSheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <header className={styles.filterSheetHead}>
              <h3>Filtros</h3>
              <button type="button" className={styles.headerBtn} onClick={() => setFiltersOpen(false)}>
                ×
              </button>
            </header>
            <section className={styles.filterBlock}>
              <p className={styles.filterLabel}>Sistema</p>
              <div className={styles.filterChips}>
                <button
                  type="button"
                  className={`${styles.filterChip} ${styles.filterChipIcon} ${!systemFilter ? styles.filterChipActive : ''}`}
                  onClick={() => setSystemFilter(null)}
                  aria-label="Todos os sistemas"
                  title="Todos os sistemas"
                >
                  <span className={`material-symbols-outlined ${styles.filterChipMaterialIcon}`} aria-hidden>
                    apps
                  </span>
                </button>
                {COFFEE_CAPSULE_SYSTEMS.map((system) => (
                  <button
                    key={system.id}
                    type="button"
                    className={`${styles.filterChip} ${styles.filterChipIcon} ${systemFilter === system.id ? styles.filterChipActive : ''}`}
                    onClick={() => setSystemFilter(system.id)}
                    aria-label={system.label}
                    title={system.label}
                    aria-pressed={systemFilter === system.id}
                  >
                    <img src={system.icon} alt="" className={styles.filterChipBrandIcon} />
                  </button>
                ))}
              </div>
            </section>
            {filterCategories.length > 0 ? (
              <section className={styles.filterBlock}>
                <p className={styles.filterLabel}>Categoria</p>
                <div className={styles.filterChips}>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${!stockCategoryFilter ? styles.filterChipActive : ''}`}
                    onClick={() => setStockCategoryFilter(null)}
                  >
                    Todas
                  </button>
                  {filterCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`${styles.filterChip} ${stockCategoryFilter === category ? styles.filterChipActive : ''}`}
                      onClick={() => setStockCategoryFilter(category)}
                    >
                      {categoryEmoji(category)} {category}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
            <button type="button" className={styles.goldBtn} onClick={() => setFiltersOpen(false)}>
              Ver resultados
            </button>
          </div>
        </div>
      ) : null}

      {catalogPickerOpen ? (
        <CoffeeCapsuleCatalogPicker
          initialSystem={systemFilter}
          onPick={applyCatalogEntry}
          onCustom={() => openManualStockCreate(systemFilter ? CAPSULE_CATEGORY_BY_SYSTEM[systemFilter] : undefined)}
          onClose={() => setCatalogPickerOpen(false)}
        />
      ) : null}

      {stockDialogOpen ? (
        <div className={styles.overlay} role="presentation" onClick={() => setStockDialogOpen(false)}>
          <form
            className={styles.dialog}
            onSubmit={handleStockSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.dialogTitle}>
              {editingStockId ? 'Editar cápsula' : 'Adicionar cápsula'}
            </h3>
            {stockFormError ? <p className={styles.formError}>{stockFormError}</p> : null}
            <label className={styles.field}>
              <span>Nome</span>
              <input
                required
                value={stockForm.name}
                onChange={(e) => setStockForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Arpeggio, Nescafé Gold…"
              />
            </label>
            <label className={styles.field}>
              <span>Sistema</span>
              <select
                value={stockForm.category}
                onChange={(e) => setStockForm((f) => ({ ...f, category: e.target.value }))}
              >
                {COFFEE_STOCK_CATEGORY_PRESETS.filter((cat) =>
                  /cápsula|capsula/i.test(cat) || cat === 'Outro',
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            {stockForm.category === 'Outro' ? (
              <label className={styles.field}>
                <span>Categoria personalizada</span>
                <input
                  value={stockForm.customCategory}
                  onChange={(e) => setStockForm((f) => ({ ...f, customCategory: e.target.value }))}
                />
              </label>
            ) : null}
            <label className={styles.field}>
              <span>Marca (opcional)</span>
              <input
                value={stockForm.brand}
                onChange={(e) => setStockForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </label>
            <p className={styles.formSectionTitle}>Características</p>
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>Intensidade 1–12</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={stockForm.intensity}
                  onChange={(e) => setStockForm((f) => ({ ...f, intensity: e.target.value }))}
                  placeholder="Ex.: 7"
                />
              </label>
              <label className={styles.field}>
                <span>Cápsulas por caixa</span>
                <input
                  type="number"
                  min={1}
                  value={stockForm.packSize}
                  onChange={(e) => setStockForm((f) => ({ ...f, packSize: e.target.value }))}
                  placeholder="10"
                />
              </label>
            </div>
            <label className={styles.field}>
              <span>Tamanho da xícara</span>
              <select
                value={stockForm.cupSize}
                onChange={(e) =>
                  setStockForm((f) => ({ ...f, cupSize: e.target.value as CoffeeCupSize | '' }))
                }
              >
                <option value="">Não informado</option>
                {COFFEE_CUP_SIZES.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.icon} {size.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Origem (opcional)</span>
              <input
                value={stockForm.origin}
                onChange={(e) => setStockForm((f) => ({ ...f, origin: e.target.value }))}
                placeholder="Ex.: Colômbia"
              />
            </label>
            <label className={styles.field}>
              <span>Perfil de sabor</span>
              <input
                value={stockForm.flavorNotes}
                onChange={(e) => setStockForm((f) => ({ ...f, flavorNotes: e.target.value }))}
                placeholder="Ex.: equilibrado, notas de nozes"
              />
            </label>
            <label className={styles.field}>
              <span>Quantidade em estoque</span>
              <input
                type="number"
                min={0}
                required
                value={stockForm.quantity}
                onChange={(e) => setStockForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </label>

            <p className={styles.formSectionTitle}>Descrição</p>
            <label className={styles.field}>
              <span>Sobre a cápsula</span>
              <textarea
                rows={3}
                value={stockForm.description}
                onChange={(e) => setStockForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Texto como no site do fabricante…"
              />
            </label>
            <label className={styles.field}>
              <span>Ingredientes</span>
              <textarea
                rows={2}
                value={stockForm.ingredients}
                onChange={(e) => setStockForm((f) => ({ ...f, ingredients: e.target.value }))}
                placeholder="Café torrado moído, …"
              />
            </label>
            <label className={styles.field}>
              <span>Suas notas</span>
              <textarea
                rows={2}
                value={stockForm.notes}
                onChange={(e) => setStockForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Lembrete pessoal…"
              />
            </label>

            <p className={styles.formSectionTitle}>Referência (opcional)</p>
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>Preço pago (R$)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={stockForm.pricePaid}
                  onChange={(e) => setStockForm((f) => ({ ...f, pricePaid: e.target.value }))}
                  placeholder="17,90"
                />
              </label>
            </div>
            <label className={styles.field}>
              <span>Link do produto</span>
              <input
                type="url"
                value={stockForm.catalogUrl}
                onChange={(e) => setStockForm((f) => ({ ...f, catalogUrl: e.target.value }))}
                placeholder="https://…"
              />
            </label>
            <label className={styles.field}>
              <span>Fotos extras (uma URL por linha)</span>
              <textarea
                rows={2}
                value={stockForm.extraImageUrls}
                onChange={(e) => setStockForm((f) => ({ ...f, extraImageUrls: e.target.value }))}
                placeholder="https://…"
              />
            </label>

            <p className={styles.formSectionTitle}>Foto principal</p>
            <CoffeeStockPhotoTools
              name={stockForm.name}
              brand={stockForm.brand}
              category={stockForm.category}
              customCategory={stockForm.customCategory}
              imageUrl={stockForm.imageUrl}
              imageUrlInput={stockForm.imageUrlInput}
              userId={userId}
              itemId={editingStockId ?? draftStockIdRef.current}
              photoInputRef={stockPhotoInputRef}
              onImageUrlInputChange={(value) =>
                setStockForm((f) => ({ ...f, imageUrlInput: value }))
              }
              onImageUrl={(url) =>
                setStockForm((f) => ({ ...f, imageUrl: url, imageUrlInput: url }))
              }
              onClearPhoto={() =>
                setStockForm((f) => ({ ...f, imageUrl: '', imageUrlInput: '' }))
              }
            />

            <div className={styles.dialogActions}>
              {editingStockId ? (
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={() => {
                    handleDeleteStock(editingStockId);
                    setStockDialogOpen(false);
                  }}
                >
                  Remover
                </button>
              ) : null}
              <button type="button" className={styles.cancelBtn} onClick={() => setStockDialogOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className={styles.saveBtn} disabled={stockSaving}>
                {stockSaving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
