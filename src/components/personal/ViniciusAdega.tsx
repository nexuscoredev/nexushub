import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fileToDrinkImageUrl, parseDrinkImageUrl } from '../../lib/drinkCartaImage';
import {
  aggregateShoppingList,
  countDrinksForAdegaItem,
  getDrinksForAdegaItem,
} from '../../lib/drinkAdegaMatch';
import { previewDrinksUnlockedByItem } from '../../lib/drinkSubstitutions';
import { adegaItemGoogleQuery, openGoogleSearch } from '../../lib/googleSearch';
import {
  loadDrinkCartaStore,
  resolveDrinks,
  syncDrinkCartaStoreFromCloud,
} from '../../lib/viniciusDrinksCartaStore';
import { AdegaItemPersonalMetaPanel } from './AdegaItemPersonalMetaPanel';
import { AdegaBeverageMediaPanel } from './AdegaBeverageMediaPanel';
import { AdegaIngredientMediaPanel, type IngredientMediaMode } from './AdegaIngredientMediaPanel';
import { AdegaItemCards } from './AdegaItemCards';
import { AdegaViewMenu } from './AdegaViewMenu';
import { loadAdegaViewMode, saveAdegaViewMode, type AdegaViewMode } from '../../lib/adegaView';
import {
  ADEGA_CATEGORY_PRESETS,
  ADEGA_INGREDIENT_CATEGORY_PRESETS,
  ADEGA_INGREDIENT_UNIT_PRESETS,
  adegaStats,
  categoryEmoji,
  createAdegaItemId,
  filterAdegaBeverages,
  filterAdegaIngredients,
  formatIngredientQuantity,
  formatVolume,
  hasAdegaItemPhoto,
  isAdegaIngredient,
  loadAdegaItems,
  normalizeAdegaInput,
  normalizeIngredientInput,
  resolveAdegaItemDisplayIcon,
  saveAdegaItems,
  syncAdegaItemsFromCloud,
  updateAdegaItemPersonalMeta,
  VINICIUS_ADEGA_BANNER_HEIGHT,
  VINICIUS_ADEGA_BANNER_URL,
  VINICIUS_ADEGA_BANNER_WIDTH,
  type AdegaItem,
  type AdegaItemInput,
  type AdegaItemKind,
} from '../../lib/viniciusAdega';
import styles from './ViniciusAdega.module.css';

type FormKind = AdegaItemKind;

type FormState = {
  name: string;
  category: string;
  customCategory: string;
  brand: string;
  quantity: string;
  unit: string;
  volumeMl: string;
  abv: string;
  origin: string;
  notes: string;
  opened: boolean;
  imageUrl: string;
  barcode: string;
  iconEmoji: string;
  ingredientMediaMode: IngredientMediaMode;
};

const EMPTY_BEVERAGE_FORM: FormState = {
  name: '',
  category: ADEGA_CATEGORY_PRESETS[0],
  customCategory: '',
  brand: '',
  quantity: '1',
  unit: 'un.',
  volumeMl: '750',
  abv: '',
  origin: '',
  notes: '',
  opened: false,
  imageUrl: '',
  barcode: '',
  iconEmoji: '🍋',
  ingredientMediaMode: 'icon',
};

const EMPTY_INGREDIENT_FORM: FormState = {
  name: '',
  category: ADEGA_INGREDIENT_CATEGORY_PRESETS[0],
  customCategory: '',
  brand: '',
  quantity: '1',
  unit: ADEGA_INGREDIENT_UNIT_PRESETS[0],
  volumeMl: '',
  abv: '',
  origin: '',
  notes: '',
  opened: false,
  imageUrl: '',
  barcode: '',
  iconEmoji: categoryEmoji(ADEGA_INGREDIENT_CATEGORY_PRESETS[0]),
  ingredientMediaMode: 'icon',
};

function emptyForm(kind: FormKind): FormState {
  return kind === 'ingredient' ? { ...EMPTY_INGREDIENT_FORM } : { ...EMPTY_BEVERAGE_FORM };
}

function itemToForm(item: AdegaItem): FormState {
  if (isAdegaIngredient(item)) {
    const preset = ADEGA_INGREDIENT_CATEGORY_PRESETS.includes(
      item.category as (typeof ADEGA_INGREDIENT_CATEGORY_PRESETS)[number],
    );
    return {
      name: item.name,
      category: preset ? item.category : 'Outro',
      customCategory: preset ? '' : item.category,
      brand: '',
      quantity: String(item.quantity),
      unit: item.unit ?? ADEGA_INGREDIENT_UNIT_PRESETS[0],
      volumeMl: '',
      abv: '',
      origin: '',
      notes: item.notes ?? '',
      opened: false,
      imageUrl: item.imageUrl ?? '',
      barcode: '',
      iconEmoji: item.iconEmoji ?? categoryEmoji(item.category),
      ingredientMediaMode: item.imageUrl ? 'photo' : 'icon',
    };
  }

  const preset = ADEGA_CATEGORY_PRESETS.includes(item.category as (typeof ADEGA_CATEGORY_PRESETS)[number]);
  return {
    name: item.name,
    category: preset ? item.category : 'Outro',
    customCategory: preset ? '' : item.category,
    brand: item.brand ?? '',
    quantity: String(item.quantity),
    unit: 'un.',
    volumeMl: item.volumeMl != null ? String(item.volumeMl) : '',
    abv: item.abv != null ? String(item.abv) : '',
    origin: item.origin ?? '',
    notes: item.notes ?? '',
    opened: Boolean(item.opened),
    imageUrl: item.imageUrl ?? '',
    barcode: item.barcode ?? '',
    iconEmoji: '🍋',
    ingredientMediaMode: 'icon',
  };
}

function formToInput(form: FormState, kind: FormKind): AdegaItemInput {
  const category = form.category === 'Outro' ? form.customCategory : form.category;
  if (kind === 'ingredient') {
    const iconEmoji = form.iconEmoji.trim() || categoryEmoji(category);
    const usePhoto = form.ingredientMediaMode === 'photo' && Boolean(form.imageUrl);
    return {
      kind: 'ingredient',
      name: form.name,
      category,
      quantity: Number(form.quantity),
      unit: form.unit,
      notes: form.notes || undefined,
      imageUrl: usePhoto ? form.imageUrl : undefined,
      iconEmoji: usePhoto ? undefined : iconEmoji,
    };
  }
  return {
    name: form.name,
    category,
    brand: form.brand || undefined,
    quantity: Number(form.quantity),
    volumeMl: form.volumeMl ? Number(form.volumeMl) : undefined,
    abv: form.abv ? Number(form.abv) : undefined,
    origin: form.origin || undefined,
    notes: form.notes || undefined,
    opened: form.opened,
    imageUrl: form.imageUrl || undefined,
    barcode: form.barcode || undefined,
  };
}

function imageUrlFieldValue(imageUrl: string): string {
  if (!imageUrl || imageUrl.startsWith('data:')) return '';
  return imageUrl;
}

export function ViniciusAdega() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editing = searchParams.get('edit') === '1';

  const [items, setItems] = useState<AdegaItem[]>(() => loadAdegaItems(userId));
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<AdegaViewMode>(() => loadAdegaViewMode(userId));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<AdegaItem | null>(null);
  const [formKind, setFormKind] = useState<FormKind>('beverage');
  const [form, setForm] = useState<FormState>(EMPTY_BEVERAGE_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [draftItemId, setDraftItemId] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [cartaStore, setCartaStore] = useState(() => loadDrinkCartaStore(userId));
  const photoInputRef = useRef<HTMLInputElement>(null);

  const setEditMode = (next: boolean) => {
    const params = new URLSearchParams(searchParams);
    params.set('adega', '1');
    if (next) params.set('edit', '1');
    else params.delete('edit');
    navigate(`/pessoal?${params.toString()}`, { replace: true });
    if (!next) {
      setDialogOpen(false);
      setEditingId(null);
      setFormError(null);
    }
  };

  useEffect(() => {
    setItems(loadAdegaItems(userId));
  }, [userId]);

  useEffect(() => {
    setViewMode(loadAdegaViewMode(userId));
  }, [userId]);

  const handleViewModeChange = (mode: AdegaViewMode) => {
    setViewMode(mode);
    if (userId) saveAdegaViewMode(userId, mode);
  };

  useEffect(() => {
    if (!userId) return;
    void syncAdegaItemsFromCloud(userId).then((cloudItems) => {
      if (cloudItems) setItems(cloudItems);
    });
  }, [userId]);

  useEffect(() => {
    setCartaStore(loadDrinkCartaStore(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void syncDrinkCartaStoreFromCloud(userId).then((cloudStore) => {
      if (cloudStore) setCartaStore(cloudStore);
    });
  }, [userId]);

  const cartaDrinks = useMemo(() => resolveDrinks(cartaStore), [cartaStore]);

  const drinkCountByItemId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.id] = countDrinksForAdegaItem(item, cartaDrinks);
    }
    return counts;
  }, [items, cartaDrinks]);

  const shoppingList = useMemo(
    () => aggregateShoppingList(cartaDrinks, items),
    [cartaDrinks, items],
  );

  const viewingDrinks = useMemo(
    () => (viewingItem ? getDrinksForAdegaItem(viewingItem, cartaDrinks) : []),
    [viewingItem, cartaDrinks],
  );

  const viewingUnlock = useMemo(
    () =>
      viewingItem && viewingItem.quantity <= 0
        ? previewDrinksUnlockedByItem(viewingItem, cartaDrinks, items)
        : null,
    [viewingItem, cartaDrinks, items],
  );

  const persist = (next: AdegaItem[]) => {
    setItems(next);
    if (userId) saveAdegaItems(userId, next);
  };

  const stats = useMemo(() => adegaStats(items), [items]);

  const beverages = useMemo(() => filterAdegaBeverages(items), [items]);
  const ingredients = useMemo(() => filterAdegaIngredients(items), [items]);

  const filteredBeverages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return beverages.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (!q) return true;
      const haystack = [item.name, item.category, item.brand, item.origin, item.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [beverages, search, categoryFilter]);

  const filteredIngredients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients.filter((item) => {
      if (!q) return true;
      const haystack = [item.name, item.category, item.notes, item.unit]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [ingredients, search]);

  const openCreate = (kind: FormKind = 'beverage') => {
    setFormKind(kind);
    setEditingId(null);
    setDraftItemId(createAdegaItemId());
    setForm(emptyForm(kind));
    setImageUrlInput('');
    setImageError(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (item: AdegaItem) => {
    setViewingItem(null);
    setFormKind(isAdegaIngredient(item) ? 'ingredient' : 'beverage');
    setEditingId(item.id);
    setDraftItemId(null);
    setForm(itemToForm(item));
    setImageUrlInput(imageUrlFieldValue(item.imageUrl ?? ''));
    setImageError(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openView = (item: AdegaItem) => {
    setViewingItem(item);
  };

  const handleCardClick = (item: AdegaItem) => {
    if (editing) openEdit(item);
    else openView(item);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setDraftItemId(null);
    setImageUrlInput('');
    setImageError(null);
    setFormError(null);
  };

  useEffect(() => {
    if (!dialogOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDialog();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [dialogOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalized =
      formKind === 'ingredient'
        ? normalizeIngredientInput(formToInput(form, 'ingredient'))
        : normalizeAdegaInput(formToInput(form, 'beverage'));
    if (!normalized) {
      setFormError(formKind === 'ingredient' ? 'Informe nome e tipo.' : 'Informe nome e categoria.');
      return;
    }

    const now = new Date().toISOString();
    const payload =
      formKind === 'ingredient'
        ? { ...normalized, kind: 'ingredient' as const }
        : normalized;

    if (editingId) {
      persist(
        items.map((item) =>
          item.id === editingId ? { ...item, ...payload, updatedAt: now } : item,
        ),
      );
    } else {
      persist([
        ...items,
        {
          id: draftItemId ?? createAdegaItemId(),
          ...payload,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    closeDialog();
  };

  const handleDelete = (id: string, kind: FormKind = 'beverage') => {
    const label = kind === 'ingredient' ? 'ingrediente' : 'item';
    if (!window.confirm(`Remover este ${label} da adega?`)) return;
    persist(items.filter((item) => item.id !== id));
  };

  const openCartaDrink = (slug: string) => {
    setViewingItem(null);
    navigate(`/pessoal?drinks=1&drink=${encodeURIComponent(slug)}`);
  };

  const uploadItemId = editingId ?? draftItemId;

  const handlePhotoFile = async (file: File | null) => {
    if (!file) return;
    setImageLoading(true);
    setImageError(null);
    try {
      const url = await fileToDrinkImageUrl(
        file,
        userId && uploadItemId ? { userId, kind: 'adega', slug: uploadItemId } : undefined,
      );
      setForm((prev) => ({
        ...prev,
        imageUrl: url,
        ingredientMediaMode: prev.ingredientMediaMode === 'icon' ? 'photo' : prev.ingredientMediaMode,
      }));
      setImageUrlInput('');
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Não foi possível usar esta foto.');
    } finally {
      setImageLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const applyImageUrl = () => {
    const parsed = parseDrinkImageUrl(imageUrlInput);
    if (!parsed) {
      setImageError('URL de imagem inválida.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      imageUrl: parsed,
      ingredientMediaMode:
        formKind === 'ingredient' && prev.ingredientMediaMode === 'icon' ? 'photo' : prev.ingredientMediaMode,
    }));
    setImageError(null);
  };

  const clearPhoto = () => {
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    setImageUrlInput('');
    setImageError(null);
  };

  const applyAdegaImageUrl = (url: string) => {
    setForm((prev) => ({
      ...prev,
      imageUrl: url,
      ingredientMediaMode:
        formKind === 'ingredient' && prev.ingredientMediaMode === 'icon' ? 'photo' : prev.ingredientMediaMode,
    }));
    setImageUrlInput('');
    setImageError(null);
  };

  useEffect(() => {
    if (!viewingItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewingItem(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [viewingItem]);

  return (
    <div className={`${styles.adega} nexus-personal-app-root nexus-adega-root ${editing ? styles.adegaEditing : ''}`}>
      <div className={`${styles.adegaToolbar} nexus-personal-toolbar`}>
        <p className={`${styles.adegaToolbarHint} nexus-personal-toolbar-hint`}>
          {editing
            ? 'Toque em um item para editar ou use + para adicionar.'
            : stats.totalItems > 0
              ? `${stats.totalItems} itens na coleção`
              : 'Sua coleção de bebidas'}
        </p>
        <button
          type="button"
          className={editing ? styles.editModeBtnActive : styles.editModeBtn}
          onClick={() => setEditMode(!editing)}
        >
          {editing ? 'Concluído' : 'Editar adega'}
        </button>
      </div>

      <header className={styles.banner}>
        <div className={`${styles.bannerArtWrap} nexus-personal-banner-wrap`}>
          <img
            src={VINICIUS_ADEGA_BANNER_URL}
            alt="Adega — estoque particular de bebidas"
            className={styles.bannerArt}
            width={VINICIUS_ADEGA_BANNER_WIDTH}
            height={VINICIUS_ADEGA_BANNER_HEIGHT}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
        {stats.totalItems > 0 ? (
          <div className={styles.bannerMeta}>
            <span className={styles.stat}>{stats.totalItems} itens</span>
            <span className={styles.stat}>{stats.totalBottles} garrafas</span>
            <span className={styles.stat}>{stats.categories.length} categorias</span>
            {!editing && shoppingList.length > 0 ? (
              <button type="button" className={styles.shoppingBannerBtn} onClick={() => setShoppingOpen(true)}>
                Lista de compras ({shoppingList.length})
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <nav className={`${styles.adegaNav} nexus-adega-nav`} aria-label="Busca e filtros da adega">
        <div className={styles.toolbar}>
          <label className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              className={styles.search}
              placeholder="Buscar bebidas e ingredientes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar na adega"
              enterKeyHint="search"
            />
          </label>
          {!editing ? (
            <AdegaViewMenu viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          ) : null}
          {editing ? (
            <button type="button" className={`${styles.addBtn} ${styles.toolbarAddBtn}`} onClick={() => openCreate('beverage')}>
              + Bebida
            </button>
          ) : null}
        </div>

        {stats.categories.length > 0 ? (
          <div className={styles.filtersWrap}>
            <div className={styles.filters} role="group" aria-label="Filtrar por categoria">
              <button
                type="button"
                className={`${styles.filterBtn} ${categoryFilter == null ? styles.filterBtnActive : ''}`}
                onClick={() => setCategoryFilter(null)}
              >
                Todas
              </button>
              {stats.categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`${styles.filterBtn} ${categoryFilter === category ? styles.filterBtnActive : ''}`}
                  onClick={() => setCategoryFilter(category)}
                  title={category}
                >
                  <span aria-hidden>{categoryEmoji(category)}</span>
                  <span className={styles.filterLabel}>{category}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <section className={styles.section} aria-labelledby="adega-beverages-title">
        <div className={styles.sectionHead}>
          <div>
            <h3 id="adega-beverages-title" className={styles.sectionTitle}>
              Bebidas
            </h3>
            <p className={styles.sectionLead}>Garrafas, latas e destilados da sua coleção.</p>
          </div>
        </div>

        <AdegaItemCards
          items={filteredBeverages}
          editing={editing}
          viewMode={viewMode}
          drinkCountByItemId={drinkCountByItemId}
          emptyIcon="🍾"
          emptyTitle={beverages.length === 0 ? 'Nenhuma bebida ainda' : 'Nenhuma bebida encontrada'}
          emptyText={
            beverages.length === 0
              ? 'Comece adicionando um whisky, vinho ou qualquer bebida da sua coleção.'
              : 'Tente outro termo ou remova o filtro de categoria.'
          }
          emptyAction={
            beverages.length === 0 && editing
              ? { label: 'Adicionar bebida', onClick: () => openCreate('beverage') }
              : beverages.length === 0
                ? { label: 'Editar adega', onClick: () => setEditMode(true) }
                : undefined
          }
          onCardClick={handleCardClick}
          onEdit={openEdit}
          onDelete={(id) => handleDelete(id, 'beverage')}
        />
      </section>

      <section className={`${styles.section} ${styles.sectionIngredients}`} aria-labelledby="adega-ingredients-title">
        <div className={styles.sectionHead}>
          <div>
            <h3 id="adega-ingredients-title" className={styles.sectionTitle}>
              Ingredientes
            </h3>
            <p className={styles.sectionLead}>
              Limão, hortelã, xaropes e tudo que você usa nos drinks.
              {stats.totalIngredients > 0 ? ` · ${stats.totalIngredients} itens` : ''}
            </p>
          </div>
          {editing ? (
            <button type="button" className={styles.sectionAddBtn} onClick={() => openCreate('ingredient')}>
              + Ingrediente
            </button>
          ) : null}
        </div>

        <AdegaItemCards
          items={filteredIngredients}
          editing={editing}
          viewMode={viewMode}
          drinkCountByItemId={drinkCountByItemId}
          emptyIcon="🍋"
          emptyTitle={ingredients.length === 0 ? 'Despensa vazia' : 'Nenhum ingrediente encontrado'}
          emptyText={
            ingredients.length === 0
              ? 'Cadastre frutas, ervas, mixers e outros itens que você tem em casa.'
              : 'Tente outro termo na busca.'
          }
          emptyAction={
            ingredients.length === 0 && editing
              ? { label: 'Adicionar à despensa', onClick: () => openCreate('ingredient') }
              : ingredients.length === 0
                ? { label: 'Editar adega', onClick: () => setEditMode(true) }
                : undefined
          }
          onCardClick={handleCardClick}
          onEdit={openEdit}
          onDelete={(id) => handleDelete(id, 'ingredient')}
        />
      </section>

      {editing ? (
        <button
          type="button"
          className={styles.fab}
          onClick={() => openCreate('beverage')}
          aria-label="Adicionar bebida à adega"
        >
          +
        </button>
      ) : null}

      {viewingItem ? (
        <div className={styles.overlay} role="presentation" onClick={() => setViewingItem(null)}>
          <div
            className={`${styles.dialog} ${styles.dialogView}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="adega-view-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.viewCloseFloating}
              onClick={() => setViewingItem(null)}
              aria-label="Fechar"
            >
              ×
            </button>
            <div className={styles.viewSheetHandle} aria-hidden />
            <div className={styles.viewHeroPremium}>
              {hasAdegaItemPhoto(viewingItem) ? (
                <img
                  src={viewingItem.imageUrl}
                  alt=""
                  className={styles.viewPhotoPremium}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className={styles.viewEmojiPremium} aria-hidden>
                  {resolveAdegaItemDisplayIcon(viewingItem)}
                </span>
              )}
            </div>
            <div className={styles.viewDetailHead}>
              <span className={styles.viewCategoryPill}>
                <span aria-hidden>{categoryEmoji(viewingItem.category)}</span>
                {viewingItem.category}
              </span>
              <h3 id="adega-view-title" className={styles.viewHeroTitle}>
                {viewingItem.name}
              </h3>
              {viewingItem.brand ? <p className={styles.viewHeroBrand}>{viewingItem.brand}</p> : null}
            </div>
            <div className={styles.viewScrollPane}>
              <section className={styles.viewSectionCard} aria-label="Detalhes do item">
                <dl className={styles.viewSpecGrid}>
                <div className={styles.viewSpecItem}>
                  <dt>Quantidade</dt>
                  <dd>
                    {isAdegaIngredient(viewingItem)
                      ? formatIngredientQuantity(viewingItem.quantity, viewingItem.unit)
                      : viewingItem.quantity}
                  </dd>
                </div>
                {!isAdegaIngredient(viewingItem) && formatVolume(viewingItem.volumeMl) ? (
                  <div className={styles.viewSpecItem}>
                    <dt>Volume</dt>
                    <dd>{formatVolume(viewingItem.volumeMl)}</dd>
                  </div>
                ) : null}
                {!isAdegaIngredient(viewingItem) && viewingItem.abv != null ? (
                  <div className={styles.viewSpecItem}>
                    <dt>Teor alcoólico</dt>
                    <dd>{viewingItem.abv}% vol.</dd>
                  </div>
                ) : null}
                {!isAdegaIngredient(viewingItem) && viewingItem.origin ? (
                  <div className={styles.viewSpecItem}>
                    <dt>Origem</dt>
                    <dd>{viewingItem.origin}</dd>
                  </div>
                ) : null}
                {!isAdegaIngredient(viewingItem) ? (
                  <div className={styles.viewSpecItem}>
                    <dt>Status</dt>
                    <dd
                      className={
                        viewingItem.opened ? styles.viewSpecValueOpened : styles.viewSpecValueClosed
                      }
                    >
                      {viewingItem.opened ? 'Garrafa aberta' : 'Fechada'}
                    </dd>
                  </div>
                ) : null}
              </dl>
              </section>
              {viewingItem.notes ? (
                <section className={styles.viewSectionCard}>
                  <p className={styles.viewNotesLabel}>Notas</p>
                  <p className={styles.viewNotesText}>{viewingItem.notes}</p>
                </section>
              ) : null}
              {!editing ? (
                <AdegaItemPersonalMetaPanel
                  item={viewingItem}
                  onChange={(patch) => {
                    if (!viewingItem) return;
                    const next = updateAdegaItemPersonalMeta(items, viewingItem.id, patch);
                    persist(next);
                    setViewingItem(next.find((entry) => entry.id === viewingItem.id) ?? null);
                  }}
                />
              ) : null}
              {viewingUnlock && viewingUnlock.drinksReady > 0 ? (
                <section className={`${styles.viewSectionCard} ${styles.viewUnlockSection}`}>
                  <p className={styles.viewNotesLabel}>
                    Se repor este item, desbloqueia {viewingUnlock.drinksReady}{' '}
                    {viewingUnlock.drinksReady === 1 ? 'drink' : 'drinks'}
                  </p>
                  <p className={styles.viewUnlockList}>{viewingUnlock.drinkTitles.join(', ')}</p>
                </section>
              ) : null}
              {viewingDrinks.length > 0 ? (
                <section className={`${styles.viewSectionCard} ${styles.viewDrinksSection}`}>
                  <p className={styles.viewNotesLabel}>
                    Drinks na carta ({viewingDrinks.length})
                  </p>
                  <ul className={styles.viewDrinksList}>
                    {viewingDrinks.map((drink) => (
                      <li key={drink.slug}>
                        <button
                          type="button"
                          className={styles.viewDrinkBtn}
                          onClick={() => openCartaDrink(drink.slug)}
                        >
                          {drink.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
            <div className={styles.viewFoot}>
              <div className={styles.viewFootActions}>
                <button
                  type="button"
                  className={styles.viewFootSecondary}
                  onClick={() =>
                    openGoogleSearch(
                      adegaItemGoogleQuery({
                        name: viewingItem.name,
                        brand: viewingItem.brand,
                        category: viewingItem.category,
                      }),
                    )
                  }
                >
                  <span className={styles.viewFootIcon} aria-hidden>
                    ⌕
                  </span>
                  Google
                </button>
                <button
                  type="button"
                  className={styles.viewFootPrimary}
                  onClick={() => setViewingItem(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {shoppingOpen ? (
        <div className={styles.overlay} role="presentation" onClick={() => setShoppingOpen(false)}>
          <div
            className={`${styles.dialog} ${styles.dialogView}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="adega-shopping-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dialogHead}>
              <div className={styles.dialogHeadRow}>
                <h3 id="adega-shopping-title" className={styles.dialogTitle}>
                  Lista de compras
                </h3>
                <button
                  type="button"
                  className={styles.dialogClose}
                  onClick={() => setShoppingOpen(false)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
            <div className={styles.viewBody}>
              <p className={styles.viewNotesText}>
                Ingredientes que faltam para drinks quase completos na carta.
              </p>
              <ul className={styles.shoppingList}>
                {shoppingList.map((entry) => (
                  <li key={entry.label} className={styles.shoppingItem}>
                    <span className={styles.shoppingLabel}>{entry.label}</span>
                    <span className={styles.shoppingMeta}>
                      {entry.count} {entry.count === 1 ? 'drink' : 'drinks'} · {entry.drinks.join(', ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.viewFoot}>
              <button type="button" className={styles.saveBtn} onClick={() => setShoppingOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dialogOpen ? (
        <div className={styles.overlay} role="presentation" onClick={closeDialog}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="adega-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dialogHead}>
              <div className={styles.dialogHandle} aria-hidden />
              <div className={styles.dialogHeadRow}>
                <h3 id="adega-form-title" className={styles.dialogTitle}>
                  {editingId
                    ? formKind === 'ingredient'
                      ? 'Editar item da despensa'
                      : 'Editar bebida'
                    : formKind === 'ingredient'
                      ? 'Adicionar à despensa'
                      : 'Adicionar bebida'}
                </h3>
                <button
                  type="button"
                  className={styles.dialogClose}
                  onClick={closeDialog}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.dialogBody}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="adega-name">
                  Nome
                </label>
                <input
                  id="adega-name"
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={
                    formKind === 'ingredient'
                      ? 'Ex.: Limão, Hortelã, Xarope de gengibre…'
                      : 'Ex.: Lagavulin 16, Malbec Reserva…'
                  }
                  required
                />
              </div>

              {formKind === 'beverage' ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="adega-brand">
                    Marca
                  </label>
                  <input
                    id="adega-brand"
                    className={styles.input}
                    value={form.brand}
                    onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
              ) : null}

              {formKind === 'beverage' ? (
                <AdegaBeverageMediaPanel
                  name={form.name}
                  brand={form.brand}
                  category={form.category}
                  customCategory={form.customCategory}
                  imageUrl={form.imageUrl}
                  userId={userId}
                  itemId={uploadItemId}
                  imageLoading={imageLoading}
                  imageError={imageError}
                  imageUrlInput={imageUrlInput}
                  photoInputRef={photoInputRef}
                  onImageUrlInputChange={(value) => {
                    setImageUrlInput(value);
                    setImageError(null);
                  }}
                  onApplyImageUrl={applyImageUrl}
                  onClearPhoto={clearPhoto}
                  onPhotoFile={handlePhotoFile}
                  onApplyProduct={(patch) => {
                    setForm((prev) => ({ ...prev, ...patch }));
                    if (patch.imageUrl) {
                      setImageUrlInput(imageUrlFieldValue(patch.imageUrl));
                      setImageError(null);
                    }
                    setFormError(null);
                  }}
                  onImageUrl={applyAdegaImageUrl}
                />
              ) : (
                <AdegaIngredientMediaPanel
                  name={form.name}
                  mediaMode={form.ingredientMediaMode}
                  iconEmoji={form.iconEmoji}
                  category={form.category}
                  customCategory={form.customCategory}
                  imageUrl={form.imageUrl}
                  userId={userId}
                  itemId={uploadItemId}
                  imageLoading={imageLoading}
                  imageError={imageError}
                  imageUrlInput={imageUrlInput}
                  photoInputRef={photoInputRef}
                  onMediaModeChange={(mode) => {
                    setForm((prev) => ({ ...prev, ingredientMediaMode: mode }));
                    setImageError(null);
                  }}
                  onIconEmojiChange={(emoji) => {
                    setForm((prev) => ({ ...prev, iconEmoji: emoji, ingredientMediaMode: 'icon' }));
                  }}
                  onImageUrlInputChange={(value) => {
                    setImageUrlInput(value);
                    setImageError(null);
                  }}
                  onApplyImageUrl={applyImageUrl}
                  onClearPhoto={clearPhoto}
                  onPhotoFile={handlePhotoFile}
                  onImageUrl={applyAdegaImageUrl}
                />
              )}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="adega-category">
                  {formKind === 'ingredient' ? 'Tipo' : 'Categoria'}
                </label>
                <select
                  id="adega-category"
                  className={styles.select}
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {(formKind === 'ingredient' ? ADEGA_INGREDIENT_CATEGORY_PRESETS : ADEGA_CATEGORY_PRESETS).map(
                    (category) => (
                      <option key={category} value={category}>
                        {categoryEmoji(category)} {category}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {form.category === 'Outro' ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="adega-custom-category">
                    {formKind === 'ingredient' ? 'Tipo personalizado' : 'Categoria personalizada'}
                  </label>
                  <input
                    id="adega-custom-category"
                    className={styles.input}
                    value={form.customCategory}
                    onChange={(e) => setForm((prev) => ({ ...prev, customCategory: e.target.value }))}
                    placeholder={
                      formKind === 'ingredient' ? 'Ex.: Bitter, Sal, Açúcar…' : 'Ex.: Sake, Vermute, Energético…'
                    }
                    required
                  />
                </div>
              ) : null}

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="adega-quantity">
                    Quantidade
                  </label>
                  <input
                    id="adega-quantity"
                    type="number"
                    min={0}
                    step={1}
                    className={styles.input}
                    value={form.quantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                </div>
                {formKind === 'ingredient' ? (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="adega-unit">
                      Unidade
                    </label>
                    <select
                      id="adega-unit"
                      className={styles.select}
                      value={form.unit}
                      onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                    >
                      {ADEGA_INGREDIENT_UNIT_PRESETS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="adega-volume">
                      Volume (ml)
                    </label>
                    <input
                      id="adega-volume"
                      type="number"
                      min={0}
                      step={1}
                      className={styles.input}
                      value={form.volumeMl}
                      onChange={(e) => setForm((prev) => ({ ...prev, volumeMl: e.target.value }))}
                      placeholder="750"
                    />
                  </div>
                )}
              </div>

              {formKind === 'beverage' ? (
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="adega-abv">
                      Teor alcoólico (%)
                    </label>
                    <input
                      id="adega-abv"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      className={styles.input}
                      value={form.abv}
                      onChange={(e) => setForm((prev) => ({ ...prev, abv: e.target.value }))}
                      placeholder="40"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="adega-origin">
                      Origem
                    </label>
                    <input
                      id="adega-origin"
                      className={styles.input}
                      value={form.origin}
                      onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
                      placeholder="Escócia, Chile…"
                    />
                  </div>
                </div>
              ) : null}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="adega-notes">
                  Notas
                </label>
                <textarea
                  id="adega-notes"
                  className={styles.textarea}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder={
                    formKind === 'ingredient'
                      ? 'Validade, onde guarda, substitutos…'
                      : 'Onde comprou, harmonização, presente…'
                  }
                />
              </div>

              {formKind === 'beverage' ? (
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={form.opened}
                    onChange={(e) => setForm((prev) => ({ ...prev, opened: e.target.checked }))}
                  />
                  Garrafa já aberta
                </label>
              ) : null}

              {formError ? <p className={styles.formError}>{formError}</p> : null}
              </div>

              <div className={styles.dialogFoot}>
                <button type="button" className={styles.cancelBtn} onClick={closeDialog}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  {editingId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
